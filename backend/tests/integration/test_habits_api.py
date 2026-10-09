import pytest
from app import create_app
from app.extensions import db
from app.models import User, Habit
import json

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
def auth_header(client):
    client.post('/api/auth/register', json={
        'full_name': 'Test User',
        'email': 'test@example.com',
        'password': 'password123',
        'confirm_password': 'password123'
    })
    resp = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'password123'
    })
    token = resp.get_json()['access_token']
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def auth_header2(client):
    client.post('/api/auth/register', json={
        'full_name': 'Test User 2',
        'email': 'test2@example.com',
        'password': 'password123',
        'confirm_password': 'password123'
    })
    resp = client.post('/api/auth/login', json={
        'email': 'test2@example.com',
        'password': 'password123'
    })
    token = resp.get_json()['access_token']
    return {'Authorization': f'Bearer {token}'}

def test_create_habit(client, auth_header):
    response = client.post('/api/habits/', headers=auth_header, json={
        'name': 'Drink Water',
        'frequency': 'daily'
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data['name'] == 'Drink Water'
    assert data['current_streak'] == 0

def test_list_habits(client, auth_header):
    client.post('/api/habits/', headers=auth_header, json={'name': 'H1'})
    client.post('/api/habits/', headers=auth_header, json={'name': 'H2'})
    
    response = client.get('/api/habits/', headers=auth_header)
    assert response.status_code == 200
    assert len(response.get_json()) == 2

def test_retrieve_habit(client, auth_header):
    create_resp = client.post('/api/habits/', headers=auth_header, json={'name': 'H1'})
    habit_id = create_resp.get_json()['id']
    
    response = client.get(f'/api/habits/{habit_id}', headers=auth_header)
    assert response.status_code == 200
    assert response.get_json()['id'] == habit_id

def test_update_habit(client, auth_header):
    create_resp = client.post('/api/habits/', headers=auth_header, json={'name': 'H1'})
    habit_id = create_resp.get_json()['id']
    
    response = client.put(f'/api/habits/{habit_id}', headers=auth_header, json={'name': 'H1 updated', 'status': 'archived'})
    assert response.status_code == 200
    assert response.get_json()['name'] == 'H1 updated'
    assert response.get_json()['status'] == 'archived'

def test_habit_completion(client, auth_header):
    create_resp = client.post('/api/habits/', headers=auth_header, json={'name': 'H1'})
    habit_id = create_resp.get_json()['id']
    
    # Record completion today
    resp = client.post(f'/api/habits/{habit_id}/completion', headers=auth_header, json={
        'completed': True
    })
    assert resp.status_code == 200
    assert resp.get_json()['current_streak'] == 1
    assert resp.get_json()['longest_streak'] == 1

def test_undo_completion(client, auth_header):
    create_resp = client.post('/api/habits/', headers=auth_header, json={'name': 'H1'})
    habit_id = create_resp.get_json()['id']
    
    client.post(f'/api/habits/{habit_id}/completion', headers=auth_header, json={'completed': True})
    
    # Undo
    resp = client.post(f'/api/habits/{habit_id}/completion', headers=auth_header, json={'completed': False})
    assert resp.status_code == 200
    assert resp.get_json()['current_streak'] == 0

def test_habit_history(client, auth_header):
    create_resp = client.post('/api/habits/', headers=auth_header, json={'name': 'H1'})
    habit_id = create_resp.get_json()['id']
    
    client.post(f'/api/habits/{habit_id}/completion', headers=auth_header, json={'completed': True})
    
    resp = client.get(f'/api/habits/{habit_id}/history', headers=auth_header)
    assert resp.status_code == 200
    assert resp.get_json()['completion_count'] == 1
    assert len(resp.get_json()['history']) == 1

def test_cross_user_access(client, auth_header, auth_header2):
    create_resp = client.post('/api/habits/', headers=auth_header, json={'name': 'H1'})
    habit_id = create_resp.get_json()['id']
    
    response = client.get(f'/api/habits/{habit_id}', headers=auth_header2)
    assert response.status_code == 404
    
    comp_resp = client.post(f'/api/habits/{habit_id}/completion', headers=auth_header2, json={'completed': True})
    assert comp_resp.status_code == 404

def test_invalid_payload(client, auth_header):
    response = client.post('/api/habits/', headers=auth_header, json={'status': 'invalid'})
    assert response.status_code == 400

def test_habit_completed_today_flag(client, auth_header):
    # 1. Habit with no completion today -> completed_today = False
    create_resp = client.post('/api/habits/', headers=auth_header, json={'name': 'Read Book'})
    habit_id = create_resp.get_json()['id']
    
    get_resp = client.get(f'/api/habits/{habit_id}', headers=auth_header)
    assert get_resp.get_json()['completed_today'] is False
    
    # 2. Habit completed today -> completed_today = True
    client.post(f'/api/habits/{habit_id}/completion', headers=auth_header, json={'completed': True})
    
    get_resp2 = client.get(f'/api/habits/{habit_id}', headers=auth_header)
    assert get_resp2.get_json()['completed_today'] is True
    
    # Check in list view
    list_resp = client.get('/api/habits/', headers=auth_header)
    habit_in_list = next(h for h in list_resp.get_json() if h['id'] == habit_id)
    assert habit_in_list['completed_today'] is True
    
    # 3. Undo completion (completed=False today) -> completed_today = False
    client.post(f'/api/habits/{habit_id}/completion', headers=auth_header, json={'completed': False})
    get_resp3 = client.get(f'/api/habits/{habit_id}', headers=auth_header)
    assert get_resp3.get_json()['completed_today'] is False

def test_habit_completed_today_past_date(client, auth_header):
    # 4. Habit completed yesterday but not today -> completed_today = False
    from datetime import date, timedelta
    create_resp = client.post('/api/habits/', headers=auth_header, json={'name': 'Past Habit'})
    habit_id = create_resp.get_json()['id']
    
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    client.post(f'/api/habits/{habit_id}/completion', headers=auth_header, json={'completed': True, 'date': yesterday})
    
    get_resp = client.get(f'/api/habits/{habit_id}', headers=auth_header)
    assert get_resp.get_json()['completed_today'] is False
