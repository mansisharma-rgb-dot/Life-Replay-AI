import pytest
import datetime
from app import create_app
from app.extensions import db
from app.models import User
from app.services.auth_service import AuthService, reset_tokens

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()
        reset_tokens.clear()

@pytest.fixture
def client(app):
    return app.test_client()

def test_password_hashing_security(app):
    # Plain text is not stored, hash method is scrypt
    user1 = User(full_name='Test', email='t1@example.com')
    user1.set_password('password123')
    
    user2 = User(full_name='Test2', email='t2@example.com')
    user2.set_password('password123')
    
    assert user1.password_hash != 'password123'
    # Two identical passwords yield different hashes (salting)
    assert user1.password_hash != user2.password_hash
    # Uses scrypt
    assert user1.password_hash.startswith('scrypt:')

def test_register_user_success(app):
    data = {'full_name': 'Test User', 'email': 'test@example.com', 'password': 'password123'}
    response_data, status_code = AuthService.register_user(data)
    assert status_code == 201
    assert response_data['success'] is True
    assert 'access_token' in response_data
    assert 'refresh_token' in response_data
    
    # Hash never returned
    assert 'password' not in response_data['user']
    assert 'password_hash' not in response_data['user']

    user = User.query.filter_by(email='test@example.com').first()
    assert user is not None

def test_register_user_duplicate_email(app):
    data = {'full_name': 'Test User', 'email': 'test@example.com', 'password': 'password123'}
    AuthService.register_user(data)
    
    response_data, status_code = AuthService.register_user(data)
    assert status_code == 409
    assert response_data['success'] is False
    assert 'error' in response_data

def test_login_user_success(app):
    AuthService.register_user({'full_name': 'Test', 'email': 'test@example.com', 'password': 'password123'})
    
    response_data, status_code = AuthService.login_user({'email': 'test@example.com', 'password': 'password123'})
    assert status_code == 200
    assert response_data['success'] is True
    assert 'access_token' in response_data
    assert 'refresh_token' in response_data
    
    # Check no password hash exposed
    assert 'password_hash' not in response_data['user']

def test_login_user_invalid(app):
    response_data, status_code = AuthService.login_user({'email': 'unknown@example.com', 'password': 'password123'})
    assert status_code == 401
    assert response_data['success'] is False

def test_login_user_wrong_password(app):
    AuthService.register_user({'full_name': 'Test', 'email': 'test@example.com', 'password': 'password123'})
    response_data, status_code = AuthService.login_user({'email': 'test@example.com', 'password': 'wrong'})
    assert status_code == 401
    assert response_data['success'] is False

def test_forgot_password_success(app):
    AuthService.register_user({'full_name': 'Test <script>', 'email': 'reset@example.com', 'password': 'oldpassword'})
    
    response_data, status_code = AuthService.forgot_password({'email': 'reset@example.com'})
    assert status_code == 200
    assert response_data['success'] is True
    
    # Token generated
    assert len(reset_tokens) == 1
    token_data = list(reset_tokens.values())[0]
    assert token_data['expires'] > datetime.datetime.now()

def test_forgot_password_unknown_email(app):
    # Should not leak whether user exists
    response_data, status_code = AuthService.forgot_password({'email': 'unknown@example.com'})
    assert status_code == 200
    assert response_data['success'] is True
    assert len(reset_tokens) == 0

def test_reset_password_success(app):
    AuthService.register_user({'full_name': 'Test', 'email': 'reset@example.com', 'password': 'oldpassword'})
    AuthService.forgot_password({'email': 'reset@example.com'})
    
    token = list(reset_tokens.keys())[0]
    
    res, status = AuthService.reset_password({'token': token, 'password': 'newpassword123'})
    assert status == 200
    assert res['success'] is True
    
    # Old password fails
    _, login_status = AuthService.login_user({'email': 'reset@example.com', 'password': 'oldpassword'})
    assert login_status == 401
    
    # New password works
    _, login_status = AuthService.login_user({'email': 'reset@example.com', 'password': 'newpassword123'})
    assert login_status == 200
    
    # Token is removed/invalidated
    assert token not in reset_tokens

def test_reset_password_invalid_token(app):
    res, status = AuthService.reset_password({'token': 'invalid-token', 'password': 'newpassword123'})
    assert status == 400
    assert res['success'] is False

def test_reset_password_expired_token(app):
    AuthService.register_user({'full_name': 'Test', 'email': 'reset@example.com', 'password': 'oldpassword'})
    AuthService.forgot_password({'email': 'reset@example.com'})
    
    token = list(reset_tokens.keys())[0]
    # Manually expire
    reset_tokens[token]['expires'] = datetime.datetime.now() - datetime.timedelta(hours=1)
    
    res, status = AuthService.reset_password({'token': token, 'password': 'newpassword123'})
    assert status == 400
    assert res['success'] is False
    assert token not in reset_tokens

def test_get_current_user(app):
    AuthService.register_user({'full_name': 'Test', 'email': 'test@example.com', 'password': 'password123'})
    user = User.query.filter_by(email='test@example.com').first()
    
    res, status = AuthService.get_current_user(user.id)
    assert status == 200
    assert res['user']['email'] == 'test@example.com'
    assert 'password_hash' not in res['user']

def test_get_current_user_invalid(app):
    res, status = AuthService.get_current_user(9999)
    assert status == 404

def test_email_service_fallback(app):
    from app.services.email_service import EmailService
    success, err = EmailService.send_password_reset_email(
        to_email='user@example.com',
        user_name='Test User',
        reset_url='http://localhost:5173/reset-password/sample-token'
    )
    # When SMTP is not configured in dev/test, it safely falls back without raising unhandled exceptions
    assert success is True
    assert err is None

def test_complete_reset_flow_with_login(app):
    # 1. Register user
    AuthService.register_user({'full_name': 'Flow User', 'email': 'flow@example.com', 'password': 'OldPassword1!'})
    
    # 2. Login works with initial password
    res, status = AuthService.login_user({'email': 'flow@example.com', 'password': 'OldPassword1!'})
    assert status == 200
    assert res['success'] is True
    
    # 3. Request forgot password
    res, status = AuthService.forgot_password({'email': 'flow@example.com'})
    assert status == 200
    assert len(reset_tokens) == 1
    token = list(reset_tokens.keys())[0]
    
    # 4. Perform password reset
    res, status = AuthService.reset_password({'token': token, 'password': 'NewPassword2@'})
    assert status == 200
    assert res['success'] is True
    
    # 5. Old password no longer works
    res, status = AuthService.login_user({'email': 'flow@example.com', 'password': 'OldPassword1!'})
    assert status == 401
    assert res['success'] is False
    
    # 6. New password successfully authenticates
    res, status = AuthService.login_user({'email': 'flow@example.com', 'password': 'NewPassword2@'})
    assert status == 200
    assert res['success'] is True
    assert 'access_token' in res

