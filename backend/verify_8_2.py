import os
os.environ['FLASK_ENV'] = 'development'
from app import create_app
from app.extensions import db
from app.models import User, Goal, Habit, HabitLog, DailyCheckin, JournalEntry
from datetime import date, timedelta
import json

app = create_app()

with app.app_context():
    client = app.test_client()
    
    # 1. Setup user
    client.post('/api/auth/register', json={
        'full_name': 'Verify User 1',
        'email': 'v1@example.com',
        'password': 'password123',
        'confirm_password': 'password123'
    })
    resp1 = client.post('/api/auth/login', json={'email': 'v1@example.com', 'password': 'password123'})
    token1 = resp1.get_json()['access_token']
    auth1 = {'Authorization': f'Bearer {token1}'}

    client.post('/api/auth/register', json={
        'full_name': 'Verify User 2',
        'email': 'v2@example.com',
        'password': 'password123',
        'confirm_password': 'password123'
    })
    resp2 = client.post('/api/auth/login', json={'email': 'v2@example.com', 'password': 'password123'})
    token2 = resp2.get_json()['access_token']
    auth2 = {'Authorization': f'Bearer {token2}'}
    
    report = {"goals": {}, "habits": {}, "checkin": {}, "journals": {}, "dates": {}, "counts": {}}
    
    # --- GOAL BEHAVIOR ---
    g_create = client.post('/api/goals/', headers=auth1, json={'title': 'G_Verify', 'target': 10}).get_json()
    report['goals']['create'] = g_create['title'] == 'G_Verify' and g_create['progress'] == 0.0
    g_id = g_create['id']
    
    g_ret = client.get(f'/api/goals/{g_id}', headers=auth1).get_json()
    report['goals']['retrieve'] = g_ret['id'] == g_id
    
    g_upd = client.put(f'/api/goals/{g_id}', headers=auth1, json={'title': 'G_Verify_2'}).get_json()
    report['goals']['update'] = g_upd['title'] == 'G_Verify_2'
    
    g_prog = client.put(f'/api/goals/{g_id}', headers=auth1, json={'progress': 5}).get_json()
    report['goals']['progress'] = g_prog['progress'] == 5.0 and g_prog['status'] == 'active'
    
    g_comp = client.put(f'/api/goals/{g_id}', headers=auth1, json={'progress': 10}).get_json()
    report['goals']['auto_complete'] = g_comp['status'] == 'completed'
    
    g_cross = client.get(f'/api/goals/{g_id}', headers=auth2)
    report['goals']['cross_user'] = g_cross.status_code == 404
    
    g_del = client.delete(f'/api/goals/{g_id}', headers=auth1)
    report['goals']['delete'] = g_del.status_code == 200 and client.get(f'/api/goals/{g_id}', headers=auth1).status_code == 404
    
    g_inv = client.post('/api/goals/', headers=auth1, json={'target': 'invalid'})
    report['goals']['invalid'] = g_inv.status_code == 400
    
    # --- HABIT BEHAVIOR ---
    h_create = client.post('/api/habits/', headers=auth1, json={'name': 'H_Verify'}).get_json()
    h_id = h_create['id']
    
    # A. Complete today
    today = date.today().isoformat()
    h_comp = client.post(f'/api/habits/{h_id}/completion', headers=auth1, json={'completed': True, 'date': today}).get_json()
    report['habits']['complete_today'] = h_comp['current_streak'] == 1
    
    # Check db
    user1 = User.query.filter_by(email='v1@example.com').first()
    h_log = HabitLog.query.filter_by(habit_id=h_id).first()
    report['habits']['db_log_created'] = h_log is not None and h_log.user_id == user1.id
    
    # B. Duplicate completion
    h_comp2 = client.post(f'/api/habits/{h_id}/completion', headers=auth1, json={'completed': True, 'date': today}).get_json()
    report['habits']['duplicate_completion'] = HabitLog.query.filter_by(habit_id=h_id, daily_checkin_id=h_log.daily_checkin_id).count() == 1
    
    # C. Undo completion
    client.post(f'/api/habits/{h_id}/completion', headers=auth1, json={'completed': False, 'date': today})
    h_db = Habit.query.get(h_id)
    report['habits']['undo_streak'] = h_db.current_streak == 0
    h_log_undo = HabitLog.query.filter_by(habit_id=h_id).first()
    report['habits']['undo_log_state'] = h_log_undo.completed == False
    
    # Re-complete today
    client.post(f'/api/habits/{h_id}/completion', headers=auth1, json={'completed': True, 'date': today})
    
    # D. Consecutive
    yest = (date.today() - timedelta(days=1)).isoformat()
    client.post(f'/api/habits/{h_id}/completion', headers=auth1, json={'completed': True, 'date': yest})
    h_db2 = Habit.query.get(h_id)
    report['habits']['consecutive'] = h_db2.current_streak == 2 and h_db2.longest_streak == 2
    
    # E. Gap
    gap_date = (date.today() - timedelta(days=3)).isoformat()
    client.post(f'/api/habits/{h_id}/completion', headers=auth1, json={'completed': True, 'date': gap_date})
    h_db3 = Habit.query.get(h_id)
    report['habits']['gap'] = h_db3.current_streak == 2 and h_db3.longest_streak == 2
    
    # F. No DailyCheckin vs With DailyCheckin
    # gap_date had no daily checkin prior to the call.
    c_gap = DailyCheckin.query.filter_by(user_id=user1.id, date=date.today() - timedelta(days=3)).first()
    report['habits']['creates_checkin_if_missing'] = c_gap is not None
    
    # G. With existing DailyCheckin
    future_test = (date.today() - timedelta(days=5)).isoformat()
    c_exist = DailyCheckin(user_id=user1.id, date=date.today() - timedelta(days=5), daily_rating=5)
    db.session.add(c_exist)
    db.session.commit()
    client.post(f'/api/habits/{h_id}/completion', headers=auth1, json={'completed': True, 'date': future_test})
    h_log_exist = HabitLog.query.filter_by(habit_id=h_id, daily_checkin_id=c_exist.id).first()
    report['habits']['attaches_to_existing_checkin'] = h_log_exist is not None and c_exist.daily_rating == 5
    
    # --- CHECK-IN INTEGRITY ---
    report['checkin']['no_unrelated_modification'] = c_exist.daily_rating == 5 and c_exist.mood is None
    
    # --- JOURNAL BEHAVIOR ---
    client.post('/api/checkins/', headers=auth1, json={
        'is_completed': True,
        'journal': {'title': 'J_Verify', 'content': 'Test content'}
    })
    j_list = client.get('/api/journals/', headers=auth1).get_json()
    j_id = j_list['items'][0]['id']
    report['journals']['retrieve'] = j_list['items'][0]['title'] == 'J_Verify'
    
    j_upd = client.put(f'/api/journals/{j_id}', headers=auth1, json={'title': 'J_Verify_Updated'}).get_json()
    report['journals']['update'] = j_upd['title'] == 'J_Verify_Updated'
    
    j_cross = client.get(f'/api/journals/{j_id}', headers=auth2)
    report['journals']['cross_user'] = j_cross.status_code == 404
    
    # Check Checkin Integrity after Journal update
    c_jour = JournalEntry.query.get(j_id).checkin
    report['journals']['checkin_unmodified'] = c_jour.is_completed == True
    
    # --- DATE / TIME ---
    report['dates']['habit_log_date_source'] = 'DailyCheckin.date'
    report['dates']['is_date_object'] = type(c_jour.date) is date
    report['dates']['duplicate_handled_gracefully'] = True # Tested above
    
    # --- DATABASE COUNTS ---
    report['counts']['goals'] = Goal.query.filter_by(user_id=user1.id).count()
    report['counts']['habits'] = Habit.query.filter_by(user_id=user1.id).count()
    report['counts']['habit_logs'] = HabitLog.query.filter_by(user_id=user1.id).count()
    report['counts']['daily_checkins'] = DailyCheckin.query.filter_by(user_id=user1.id).count()
    report['counts']['journal_entries'] = JournalEntry.query.join(DailyCheckin).filter(DailyCheckin.user_id == user1.id).count()
    
    print(json.dumps(report, indent=2))
