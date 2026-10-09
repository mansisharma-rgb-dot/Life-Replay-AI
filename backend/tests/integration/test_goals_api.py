import pytest
from app import create_app
from app.extensions import db
from app.models import User, Goal
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

def test_create_goal(client, auth_header):
    response = client.post('/api/goals/', headers=auth_header, json={
        'title': 'Learn Python',
        'target': 100,
        'category': 'Education'
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data['title'] == 'Learn Python'
    assert data['progress'] == 0.0

def test_list_goals(client, auth_header):
    client.post('/api/goals/', headers=auth_header, json={'title': 'G1'})
    client.post('/api/goals/', headers=auth_header, json={'title': 'G2'})
    
    response = client.get('/api/goals/', headers=auth_header)
    assert response.status_code == 200
    assert len(response.get_json()) == 2

def test_retrieve_goal(client, auth_header):
    create_resp = client.post('/api/goals/', headers=auth_header, json={'title': 'G1'})
    goal_id = create_resp.get_json()['id']
    
    response = client.get(f'/api/goals/{goal_id}', headers=auth_header)
    assert response.status_code == 200
    assert response.get_json()['id'] == goal_id

def test_update_goal_progress(client, auth_header):
    create_resp = client.post('/api/goals/', headers=auth_header, json={'title': 'G1', 'target': 100})
    goal_id = create_resp.get_json()['id']
    
    response = client.put(f'/api/goals/{goal_id}', headers=auth_header, json={'progress': 50})
    assert response.status_code == 200
    assert response.get_json()['progress'] == 50
    assert response.get_json()['status'] == 'active'

def test_update_goal_completion(client, auth_header):
    create_resp = client.post('/api/goals/', headers=auth_header, json={'title': 'G1', 'target': 100})
    goal_id = create_resp.get_json()['id']
    
    response = client.put(f'/api/goals/{goal_id}', headers=auth_header, json={'progress': 100})
    assert response.status_code == 200
    assert response.get_json()['status'] == 'completed'

def test_delete_goal(client, auth_header):
    create_resp = client.post('/api/goals/', headers=auth_header, json={'title': 'G1'})
    goal_id = create_resp.get_json()['id']
    
    del_resp = client.delete(f'/api/goals/{goal_id}', headers=auth_header)
    assert del_resp.status_code == 200
    
    get_resp = client.get(f'/api/goals/{goal_id}', headers=auth_header)
    assert get_resp.status_code == 404

def test_unauthenticated_access(client):
    response = client.get('/api/goals/')
    assert response.status_code == 401

def test_cross_user_access(client, auth_header, auth_header2):
    create_resp = client.post('/api/goals/', headers=auth_header, json={'title': 'G1'})
    goal_id = create_resp.get_json()['id']
    
    response = client.get(f'/api/goals/{goal_id}', headers=auth_header2)
    assert response.status_code == 404
    
    update_resp = client.put(f'/api/goals/{goal_id}', headers=auth_header2, json={'title': 'Hacked'})
    assert update_resp.status_code == 404

def test_invalid_payload(client, auth_header):
    response = client.post('/api/goals/', headers=auth_header, json={
        'target': 'not-a-number'
    })
    assert response.status_code == 400
    assert 'success' in response.get_json()
    assert response.get_json()['success'] is False
