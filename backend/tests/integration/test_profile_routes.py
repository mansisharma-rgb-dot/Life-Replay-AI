import pytest
import json
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
def user(app):
    u = User(full_name='Route Test User', email='route@test.com')
    u.set_password('password123')
    db.session.add(u)
    db.session.commit()
    return u

@pytest.fixture
def token(app, user):
    with app.app_context():
        return create_access_token(identity=str(user.id))

def test_get_profile_route(client, token):
    response = client.get('/api/profile/', headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    assert data['profile']['email'] == 'route@test.com'

def test_update_profile_route(client, token):
    response = client.put('/api/profile/', 
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
        data=json.dumps({'bio': 'Updated via route'})
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    assert data['profile']['bio'] == 'Updated via route'

def test_unauthorized_access(client):
    response = client.get('/api/profile/')
    assert response.status_code == 401
