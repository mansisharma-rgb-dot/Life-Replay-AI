import pytest
import json
from app import create_app
from app.extensions import db
from app.models import User
from flask_jwt_extended import create_access_token
from io import BytesIO
import os

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
    u = User(full_name='Avatar Test User', email='avatar@test.com')
    u.set_password('password123')
    db.session.add(u)
    db.session.commit()
    return u

@pytest.fixture
def token(app, user):
    with app.app_context():
        return create_access_token(identity=str(user.id))

def test_upload_avatar_success(client, token, user):
    data = {
        'avatar': (BytesIO(b'fake image data'), 'test_image.png')
    }
    response = client.post('/api/profile/avatar', headers={'Authorization': f'Bearer {token}'}, data=data, content_type='multipart/form-data')
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['success'] is True
    assert json_data['profile']['has_avatar'] is True
    
    # Verify file was created
    u = User.query.get(user.id)
    assert u.avatar_filename is not None
    assert u.avatar_filename.endswith('.png')

def test_upload_avatar_invalid_extension(client, token):
    data = {
        'avatar': (BytesIO(b'fake image data'), 'test_image.txt')
    }
    response = client.post('/api/profile/avatar', headers={'Authorization': f'Bearer {token}'}, data=data, content_type='multipart/form-data')
    assert response.status_code == 400
    assert 'Invalid file type' in response.get_json()['error']

def test_remove_avatar(client, token, user):
    # First upload
    data = {'avatar': (BytesIO(b'fake image data'), 'test_image.png')}
    client.post('/api/profile/avatar', headers={'Authorization': f'Bearer {token}'}, data=data, content_type='multipart/form-data')
    
    u = User.query.get(user.id)
    assert u.avatar_filename is not None
    
    # Then remove
    response = client.delete('/api/profile/avatar', headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['profile']['has_avatar'] is False
    
    u = User.query.get(user.id)
    assert u.avatar_filename is None

def test_get_avatar_missing(client, token):
    response = client.get('/api/profile/avatar', headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 404
    assert 'Avatar not found' in response.get_json()['error']
