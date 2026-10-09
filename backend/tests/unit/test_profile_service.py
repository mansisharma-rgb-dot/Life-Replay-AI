import pytest
from app import create_app
from app.extensions import db
from app.models import User
from app.services.profile_service import ProfileService

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def user(app):
    u = User(full_name='Test User', email='test@test.com', timezone='UTC', preferred_language='en')
    u.set_password('password123')
    db.session.add(u)
    db.session.commit()
    return u

def test_get_profile(app, user):
    result, status = ProfileService.get_profile(user.id)
    assert status == 200
    assert result['success'] is True
    assert result['profile']['full_name'] == 'Test User'
    assert result['profile']['timezone'] == 'UTC'
    assert result['profile']['ai_style'] == 'Balanced' # Default value

def test_update_profile(app, user):
    data = {
        'bio': 'I am a test user.',
        'timezone': 'America/New_York',
        'ai_style': 'Concise',
        'privacy_analyze_documents': False
    }
    result, status = ProfileService.update_profile(user.id, data)
    assert status == 200
    assert result['success'] is True
    
    # Check DB
    u = User.query.get(user.id)
    assert u.bio == 'I am a test user.'
    assert u.timezone == 'America/New_York'
    assert u.ai_style == 'Concise'
    assert u.privacy_analyze_documents is False

def test_change_password_success(app, user):
    data = {
        'current_password': 'password123',
        'new_password': 'newpassword123'
    }
    result, status = ProfileService.change_password(user.id, data)
    assert status == 200
    assert result['success'] is True
    
    # Verify new password
    u = User.query.get(user.id)
    assert u.check_password('newpassword123') is True
    assert u.check_password('password123') is False

def test_change_password_failure(app, user):
    # Wrong current password
    data = {
        'current_password': 'wrongpassword',
        'new_password': 'newpassword123'
    }
    result, status = ProfileService.change_password(user.id, data)
    assert status == 401
    assert result['success'] is False

def test_delete_account(app, user):
    result, status = ProfileService.delete_account(user.id)
    assert status == 200
    assert result['success'] is True
    
    # Verify user is gone
    u = User.query.get(user.id)
    assert u is None
