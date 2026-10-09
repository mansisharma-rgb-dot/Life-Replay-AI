import pytest
from app import create_app
from app.extensions import db
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

def test_list_journals(client, auth_header):
    # Journals are created via checkin
    client.post('/api/checkins/', headers=auth_header, json={
        'is_completed': True,
        'journal': {'title': 'Day 1', 'content': 'Test'}
    })
    
    response = client.get('/api/journals/', headers=auth_header)
    assert response.status_code == 200
    assert response.get_json()['total'] == 1
    assert response.get_json()['items'][0]['title'] == 'Day 1'

def test_retrieve_journal(client, auth_header):
    client.post('/api/checkins/', headers=auth_header, json={
        'is_completed': True,
        'journal': {'title': 'Day 1', 'content': 'Test'}
    })
    
    list_resp = client.get('/api/journals/', headers=auth_header)
    journal_id = list_resp.get_json()['items'][0]['id']
    
    response = client.get(f'/api/journals/{journal_id}', headers=auth_header)
    assert response.status_code == 200
    assert response.get_json()['id'] == journal_id

def test_update_journal(client, auth_header):
    client.post('/api/checkins/', headers=auth_header, json={
        'is_completed': True,
        'journal': {'title': 'Day 1', 'content': 'Test'}
    })
    
    list_resp = client.get('/api/journals/', headers=auth_header)
    journal_id = list_resp.get_json()['items'][0]['id']
    
    response = client.put(f'/api/journals/{journal_id}', headers=auth_header, json={'title': 'Updated Day 1'})
    assert response.status_code == 200
    assert response.get_json()['title'] == 'Updated Day 1'

def test_cross_user_access(client, auth_header, auth_header2):
    client.post('/api/checkins/', headers=auth_header, json={
        'is_completed': True,
        'journal': {'title': 'Day 1', 'content': 'Test'}
    })
    
    list_resp = client.get('/api/journals/', headers=auth_header)
    journal_id = list_resp.get_json()['items'][0]['id']
    
    response = client.get(f'/api/journals/{journal_id}', headers=auth_header2)
    assert response.status_code == 404
    
    update_resp = client.put(f'/api/journals/{journal_id}', headers=auth_header2, json={'title': 'Hacked'})
    assert update_resp.status_code == 404

def test_unauthenticated_access(client):
    response = client.get('/api/journals/')
    assert response.status_code == 401
