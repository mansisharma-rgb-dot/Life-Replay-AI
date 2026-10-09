import pytest
from app import create_app
from app.extensions import db
from app.models import User, DailyCheckin, LifeScore
from flask_jwt_extended import create_access_token
from datetime import date

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

def test_unauthenticated_access(client):
    res = client.get('/api/analytics/overview')
    assert res.status_code == 401

def test_authenticated_access(client, auth_headers):
    res = client.get('/api/analytics/overview', headers=auth_headers)
    assert res.status_code == 200

def test_idor_protection(client, app, auth_headers):
    # Create another user's data
    with app.app_context():
        u2 = User(full_name='Other', email='other@example.com')
        u2.set_password('test')
        db.session.add(u2)
        db.session.commit()
        
        c = DailyCheckin(user_id=u2.id, date=date.today(), is_completed=True)
        db.session.add(c)
        db.session.commit()
        
    res = client.get('/api/analytics/overview', headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()['totalCheckins'] == 0 # Should not see u2's checkin

def test_life_score_route(client, auth_headers):
    res = client.get('/api/analytics/life-score?timeRange=7d', headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert 'average' in data
    assert 'history' in data

def test_correlations_route(client, auth_headers):
    res = client.get('/api/analytics/correlations?timeRange=30d', headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert 'correlations' in data
