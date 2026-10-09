import pytest
import io
import os
import json
from datetime import date, timedelta
from app import create_app
from app.extensions import db
from app.models import User, DailyCheckin, Activities, MoodLog, Wellbeing, JournalEntry, LifeScore, Habit, HabitLog, DocumentMemory
from flask_jwt_extended import create_access_token

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_user(app):
    with app.app_context():
        user = User(full_name='Phase32 User', email='phase32@example.com')
        user.set_password('Password123!')
        db.session.add(user)
        db.session.commit()
        
        token = create_access_token(identity=str(user.id))
        return {'Authorization': f'Bearer {token}'}, user.id

def test_history_endpoint_rich_data_and_period_filters(client, app, auth_user):
    headers, user_id = auth_user
    today = date.today()
    
    with app.app_context():
        # Create a habit
        habit = Habit(user_id=user_id, name='Morning Meditation', icon='🧘', current_streak=5)
        db.session.add(habit)
        db.session.flush()
        
        # Create check-ins for multiple dates
        for i in range(10):
            check_date = today - timedelta(days=i)
            c = DailyCheckin(user_id=user_id, date=check_date, is_completed=(i % 2 == 0), daily_rating=8)
            db.session.add(c)
            db.session.flush()
            
            # Add activities
            act = Activities(
                daily_checkin_id=c.id,
                study_hours=3.5,
                work_hours=4.0,
                sleep_hours=7.5,
                water_intake_ml=2500,
                meditation_minutes=20,
                walking_steps=8500,
                exercise_minutes=45,
                reading_minutes=30
            )
            db.session.add(act)
            
            # Add mood
            m = MoodLog(daily_checkin_id=c.id, mood_score=8, intensity=4, mood_label='😊', note=f'Day {i} was productive')
            db.session.add(m)
            
            # Add wellbeing
            wb = Wellbeing(daily_checkin_id=c.id, energy_level=4, stress_level=2, focus_level=4, motivation_level=5)
            db.session.add(wb)
            
            # Add journal
            j = JournalEntry(daily_checkin_id=c.id, title=f'Reflection for Day {i}', content=f'Accomplished deep work and stayed consistent on day {i}.')
            db.session.add(j)
            
            # Add habit log
            h_log = HabitLog(daily_checkin_id=c.id, user_id=user_id, habit_id=habit.id, name=habit.name, completed=True)
            db.session.add(h_log)
            
            # Add life score
            ls = LifeScore(user_id=user_id, date=check_date, score=85, breakdown={'activities': 80, 'mood': 85, 'wellbeing': 90})
            db.session.add(ls)
            
        db.session.commit()

    # 1. Test get all history
    res = client.get('/api/checkins/history', headers=headers)
    assert res.status_code == 200
    data = res.get_json()
    assert 'items' in data
    assert len(data['items']) == 10
    
    first_item = data['items'][0]
    assert first_item['is_completed'] == True
    assert first_item['daily_rating'] == 8
    assert first_item['life_score'] == 85
    assert first_item['has_activities'] == True
    assert first_item['activities']['study_hours'] == 3.5
    assert first_item['activities']['sleep_hours'] == 7.5
    assert first_item['activities']['water_intake_ml'] == 2500
    assert first_item['activities']['walking_steps'] == 8500
    assert first_item['activities']['meditation_minutes'] == 20
    assert first_item['has_mood'] == True
    assert first_item['mood']['mood_score'] == 8
    assert first_item['mood']['mood_label'] == '😊'
    assert first_item['has_wellbeing'] == True
    assert first_item['wellbeing']['energy_level'] == 4
    assert first_item['wellbeing']['stress_level'] == 2
    assert first_item['wellbeing']['focus_level'] == 4
    assert first_item['wellbeing']['motivation_level'] == 5
    assert first_item['has_journal'] == True
    assert 'Reflection for Day 0' in first_item['journal']['title']
    assert len(first_item['habit_logs']) == 1
    assert first_item['habit_logs'][0]['name'] == 'Morning Meditation'
    assert first_item['habit_logs'][0]['completed'] == True

    # 2. Test get by specific date
    date_str = today.isoformat()
    by_date_res = client.get(f'/api/checkins/date/{date_str}', headers=headers)
    assert by_date_res.status_code == 200
    date_data = by_date_res.get_json()
    assert date_data['found'] == True
    assert date_data['activities']['study_hours'] == 3.5

    # 3. Test period filtering
    # This Week
    this_week_res = client.get('/api/checkins/history?period=this_week', headers=headers)
    assert this_week_res.status_code == 200
    this_week_items = this_week_res.get_json()['items']
    assert len(this_week_items) > 0

    # Date range filtering
    start = (today - timedelta(days=3)).isoformat()
    end = today.isoformat()
    range_res = client.get(f'/api/checkins/history?start_date={start}&end_date={end}', headers=headers)
    assert range_res.status_code == 200
    range_items = range_res.get_json()['items']
    assert len(range_items) == 4

def test_document_local_summary_and_lifecycle(client, auth_user):
    headers, user_id = auth_user
    
    document_text = (
        b"August 23, 2026 Daily Journal and Study Notes\n\n"
        b"Overview:\n"
        b"Today I focused on building the machine learning model for college project.\n"
        b"Key topics covered include Python data processing, neural networks, and productivity.\n\n"
        b"Key Points:\n"
        b"- Finished data preprocessing pipeline with 95% accuracy.\n"
        b"- Completed 3 hours of deep study and 20 minutes of meditation.\n"
        b"- Met personal goals for daily routines and consistent habit tracking.\n\n"
        b"Dates to remember: August 20, 2026 and August 22, 2026 for the project submission.\n"
    )
    
    # 1. Upload document (without OPENAI_API_KEY)
    data = {
        'file': (io.BytesIO(document_text), 'personal_journal_2026.txt')
    }
    upload_res = client.post('/api/documents/', headers=headers, data=data, content_type='multipart/form-data')
    assert upload_res.status_code == 200
    upload_data = upload_res.get_json()
    doc = upload_data['document']
    
    assert doc['status'] == 'processed'
    assert doc['is_local_summary'] == True
    assert doc['summary_type'] == 'local'
    assert 'overview' in doc and len(doc['overview']) > 0
    assert 'key_topics' in doc and len(doc['key_topics']) > 0
    assert 'key_points' in doc and len(doc['key_points']) > 0
    assert 'key_dates' in doc
    assert 'extracted_chars' in doc and doc['extracted_chars'] > 100
    assert 'extracted_words' in doc and doc['extracted_words'] > 20
    assert 'extracted_text' in doc
    
    doc_id = doc['id']
    
    # 2. Get document details
    get_res = client.get(f'/api/documents/{doc_id}', headers=headers)
    assert get_res.status_code == 200
    get_doc = get_res.get_json()
    assert get_doc['id'] == doc_id
    assert get_doc['is_local_summary'] == True
    
    # 3. List documents
    list_res = client.get('/api/documents/', headers=headers)
    assert list_res.status_code == 200
    docs = list_res.get_json()
    assert len(docs) == 1
    assert docs[0]['id'] == doc_id
    
    # 4. Delete document
    del_res = client.delete(f'/api/documents/{doc_id}', headers=headers)
    assert del_res.status_code == 200
    
    # 5. Confirm deletion from database
    get_after_del = client.get(f'/api/documents/{doc_id}', headers=headers)
    assert get_after_del.status_code == 404
    
    list_after_del = client.get('/api/documents/', headers=headers)
    assert len(list_after_del.get_json()) == 0
