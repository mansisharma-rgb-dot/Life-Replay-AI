import pytest
from app import create_app
from app.extensions import db
from app.models import User
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
def auth_headers(app):
    u = User(full_name='Test', email='test@example.com')
    u.set_password('test')
    db.session.add(u)
    db.session.commit()
    
    access_token = create_access_token(identity=str(u.id))
    return {'Authorization': f'Bearer {access_token}'}

def test_get_today_unauthenticated(client):
    res = client.get('/api/checkins/today')
    assert res.status_code == 401

def test_get_today_authenticated(client, auth_headers):
    res = client.get('/api/checkins/today', headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()['is_completed'] is False

def test_upsert_draft_authenticated(client, auth_headers):
    res = client.post('/api/checkins/', headers=auth_headers, json={
        'is_completed': False,
        'daily_rating': 7
    })
    assert res.status_code == 200
    assert res.get_json()['daily_rating'] == 7

def test_upsert_validation_error(client, auth_headers):
    res = client.post('/api/checkins/', headers=auth_headers, json={
        'is_completed': False,
        'activities': {'sleep_hours': 30} # over 24
    })
    assert res.status_code == 400
    assert 'activities' in res.get_json()['details']

def test_get_history_authenticated(client, auth_headers):
    client.post('/api/checkins/', headers=auth_headers, json={
        'is_completed': True,
        'daily_rating': 9
    })
    
    res = client.get('/api/checkins/history', headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data['total'] == 1
    assert data['items'][0]['daily_rating'] == 9

def test_idor_protection(client, app, auth_headers):
    # Try sending user_id in the body, it should be ignored and it uses JWT
    res = client.post('/api/checkins/', headers=auth_headers, json={
        'user_id': 999, # Malicious
        'is_completed': False
    })
    assert res.status_code == 200
    
    # We should see it under our own history
    hist = client.get('/api/checkins/history', headers=auth_headers)
    assert hist.get_json()['total'] == 1

def test_checkin_habit_logs_serialization(client, auth_headers):
    # Create a habit
    habit_res = client.post('/api/habits/', headers=auth_headers, json={'name': 'Water'})
    habit_id = habit_res.get_json()['id']
    
    # Complete it today
    client.post(f'/api/habits/{habit_id}/completion', headers=auth_headers, json={'completed': True})
    
    # Get today's checkin
    res = client.get('/api/checkins/today', headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    
    assert 'habit_logs' in data
    assert len(data['habit_logs']) == 1
    assert data['habit_logs'][0]['habit_id'] == habit_id
    assert data['habit_logs'][0]['completed'] is True
    
    # Un-complete it
    client.post(f'/api/habits/{habit_id}/completion', headers=auth_headers, json={'completed': False})
    
    res2 = client.get('/api/checkins/today', headers=auth_headers)
    assert res2.get_json()['habit_logs'][0]['completed'] is False

def test_get_checkin_by_date_success(client, auth_headers):
    # Upsert a checkin
    client.post('/api/checkins/', headers=auth_headers, json={
        'is_completed': True,
        'daily_rating': 8,
        'activities': {'sleep_hours': 7.5, 'water_intake_ml': 2000, 'work_hours': 6},
        'mood': {'mood_score': 8, 'mood_label': '😊', 'note': 'Productive day'},
        'wellbeing': {'energy_level': 4, 'stress_level': 2, 'focus_level': 4, 'motivation_level': 5},
        'journal': {'title': 'Historical Test', 'content': 'Saved reflection text for calendar.'}
    })
    
    today_res = client.get('/api/checkins/today', headers=auth_headers)
    today_date = today_res.get_json()['date']
    
    # Query exact date
    res = client.get(f'/api/checkins/date/{today_date}', headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data['found'] is True
    assert data['date'] == today_date
    assert data['daily_rating'] == 8
    assert data['activities']['sleep_hours'] == 7.5
    assert data['activities']['water_intake_ml'] == 2000
    assert data['mood']['mood_label'] == '😊'
    assert data['mood']['note'] == 'Productive day'
    assert data['wellbeing']['energy_level'] == 4
    assert data['journal']['title'] == 'Historical Test'
    assert data['journal']['content'] == 'Saved reflection text for calendar.'

def test_get_checkin_by_date_empty(client, auth_headers):
    res = client.get('/api/checkins/date/2025-01-01', headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data['found'] is False
    assert data['date'] == '2025-01-01'
    assert data['is_completed'] is False

def test_get_checkin_by_date_invalid_format(client, auth_headers):
    res = client.get('/api/checkins/date/invalid-date', headers=auth_headers)
    assert res.status_code == 400
    assert 'Invalid date format' in res.get_json()['error']

def test_get_checkin_by_date_user_isolation(client, app, auth_headers):
    # User 1 completes checkin
    client.post('/api/checkins/', headers=auth_headers, json={
        'is_completed': True,
        'daily_rating': 10,
        'journal': {'title': 'User 1 Secret', 'content': 'Confidential'}
    })
    
    today_date = client.get('/api/checkins/today', headers=auth_headers).get_json()['date']
    
    # Create User 2
    with app.app_context():
        u2 = User(full_name='User Two', email='user2@example.com')
        u2.set_password('test')
        db.session.add(u2)
        db.session.commit()
        u2_id = u2.id
        
    token2 = create_access_token(identity=str(u2_id))
    headers2 = {'Authorization': f'Bearer {token2}'}
    
    # User 2 checks that date - should see empty record for themselves, NOT User 1's
    res2 = client.get(f'/api/checkins/date/{today_date}', headers=headers2)
    assert res2.status_code == 200
    data2 = res2.get_json()
    assert data2['found'] is False
    assert data2.get('journal', {}).get('title') is None or data2.get('journal', {}).get('title') == ''
