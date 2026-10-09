import pytest
from app import create_app
from app.extensions import db
from app.models import User
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

def test_register_route(client):
    response = client.post('/api/auth/register', json={
        'full_name': 'Test Route User',
        'email': 'route@example.com',
        'password': 'password123',
        'confirm_password': 'password123'
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data['success'] is True
    assert 'access_token' in data
    
    # Hash is not returned
    assert 'password_hash' not in str(data)
    
    # refresh token is removed from JSON body and set in cookie
    assert 'refresh_token' not in data
    
    # Check if cookie is set
    cookies = response.headers.getlist('Set-Cookie')
    assert any('refresh_token_cookie' in c for c in cookies)

def test_register_route_invalid_email(client):
    response = client.post('/api/auth/register', json={
        'full_name': 'Test',
        'email': 'not-an-email',
        'password': 'password123',
        'confirm_password': 'password123'
    })
    assert response.status_code == 400
    assert 'email' in response.get_json()['details']

def test_register_route_missing_fields(client):
    response = client.post('/api/auth/register', json={
        'email': 'test@example.com'
    })
    assert response.status_code == 400
    assert 'password' in response.get_json()['details']
    assert 'full_name' in response.get_json()['details']

def test_register_route_oversized_name(client):
    response = client.post('/api/auth/register', json={
        'full_name': 'A' * 151,
        'email': 'test@example.com',
        'password': 'password123',
        'confirm_password': 'password123'
    })
    assert response.status_code == 400
    assert 'full_name' in response.get_json()['details']

def test_login_route(client, app):
    client.post('/api/auth/register', json={
        'full_name': 'Test Login',
        'email': 'login@example.com',
        'password': 'password123',
        'confirm_password': 'password123'
    })

    response = client.post('/api/auth/login', json={
        'email': 'login@example.com',
        'password': 'password123'
    })
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert 'access_token' in data
    assert 'refresh_token' not in data
    assert 'password_hash' not in str(data)
    
    cookies = response.headers.getlist('Set-Cookie')
    assert any('refresh_token_cookie' in c for c in cookies)

def test_login_route_malformed(client):
    response = client.post('/api/auth/login', json={'email': 'test'})
    assert response.status_code == 400

def test_logout_clears_cookie(client, app):
    client.post('/api/auth/register', json={
        'full_name': 'Logout User',
        'email': 'logout@example.com',
        'password': 'password123',
        'confirm_password': 'password123'
    })
    
    login_resp = client.post('/api/auth/login', json={
        'email': 'logout@example.com',
        'password': 'password123'
    })
    access_token = login_resp.get_json()['access_token']
    
    # Logout
    logout_resp = client.post('/api/auth/logout', headers={
        'Authorization': f'Bearer {access_token}'
    })
    assert logout_resp.status_code == 200
    
    cookies = logout_resp.headers.getlist('Set-Cookie')
    
    # Verify the clearing attributes match creation (Lax, Path=/, expires)
    cookie_str = " ".join(cookies).lower()
    assert 'refresh_token_cookie' in cookie_str
    assert 'expires=' in cookie_str or 'max-age=0' in cookie_str
    assert 'samesite=lax' in cookie_str

def test_refresh_token_route(client, app):
    client.post('/api/auth/register', json={
        'full_name': 'Refresh User',
        'email': 'refresh@example.com',
        'password': 'password123',
        'confirm_password': 'password123'
    })
    
    login_resp = client.post('/api/auth/login', json={
        'email': 'refresh@example.com',
        'password': 'password123'
    })
    
    # Extract the cookie from login response
    cookies = login_resp.headers.getlist('Set-Cookie')
    refresh_cookie = next(c for c in cookies if 'refresh_token_cookie' in c).split(';')[0]
    
    # Make refresh request
    refresh_resp = client.post('/api/auth/refresh', headers={
        'Cookie': refresh_cookie
    })
    
    assert refresh_resp.status_code == 200
    data = refresh_resp.get_json()
    assert 'access_token' in data

def test_refresh_token_missing(client, app):
    refresh_resp = client.post('/api/auth/refresh')
    assert refresh_resp.status_code == 401
    assert 'Missing cookie' in str(refresh_resp.get_json())

def test_get_me_route(client, app):
    client.post('/api/auth/register', json={
        'full_name': 'Me User',
        'email': 'me@example.com',
        'password': 'password123',
        'confirm_password': 'password123'
    })
    
    login_resp = client.post('/api/auth/login', json={
        'email': 'me@example.com',
        'password': 'password123'
    })
    access_token = login_resp.get_json()['access_token']
    
    me_resp = client.get('/api/auth/me', headers={
        'Authorization': f'Bearer {access_token}'
    })
    
    assert me_resp.status_code == 200
    data = me_resp.get_json()
    assert data['user']['email'] == 'me@example.com'
    assert 'password_hash' not in str(data)

def test_get_me_unauthorized(client):
    me_resp = client.get('/api/auth/me')
    assert me_resp.status_code == 401

def test_password_reset_routes(client, app):
    client.post('/api/auth/register', json={
        'full_name': 'Reset User',
        'email': 'reset@example.com',
        'password': 'password123',
        'confirm_password': 'password123'
    })
    
    forgot_resp = client.post('/api/auth/forgot-password', json={
        'email': 'reset@example.com'
    })
    assert forgot_resp.status_code == 200
    
    # Check that error is caught when password mismatches in reset
    reset_fail_resp = client.post('/api/auth/reset-password', json={
        'token': 'some-token',
        'password': 'newpassword123',
        'confirm_password': 'wrongpassword'
    })
    assert reset_fail_resp.status_code == 400

# --- Phase 30.1 Authentication Polish Tests ---

def test_login_exact_match(client, app):
    client.post('/api/auth/register', json={
        'full_name': 'Mansi Sharma',
        'email': 'mansi@example.com',
        'password': 'Mansi@123',
        'confirm_password': 'Mansi@123'
    })
    
    # Test 1: Exact match succeeds
    response = client.post('/api/auth/login', json={
        'email': 'mansi@example.com',
        'password': 'Mansi@123'
    })
    assert response.status_code == 200
    
def test_login_case_sensitivity(client, app):
    client.post('/api/auth/register', json={
        'full_name': 'Mansi Sharma',
        'email': 'case@example.com',
        'password': 'Mansi@123',
        'confirm_password': 'Mansi@123'
    })
    
    # Test 2: Different capitalization fails
    response_lower = client.post('/api/auth/login', json={
        'email': 'case@example.com',
        'password': 'mansi@123'
    })
    assert response_lower.status_code == 401
    assert 'Invalid email or password' in str(response_lower.get_json())
    
    response_upper = client.post('/api/auth/login', json={
        'email': 'case@example.com',
        'password': 'MANSI@123'
    })
    assert response_upper.status_code == 401
    
    # Test 3: Completely incorrect password fails
    response_wrong = client.post('/api/auth/login', json={
        'email': 'case@example.com',
        'password': 'WrongPassword!'
    })
    assert response_wrong.status_code == 401

def test_login_whitespace_preservation(client, app):
    client.post('/api/auth/register', json={
        'full_name': 'Mansi Sharma',
        'email': 'space@example.com',
        'password': 'Mansi @ 123 ',
        'confirm_password': 'Mansi @ 123 '
    })
    
    # Test 4: Password with whitespace succeeds ONLY if exact
    response_exact = client.post('/api/auth/login', json={
        'email': 'space@example.com',
        'password': 'Mansi @ 123 '
    })
    assert response_exact.status_code == 200
    
    response_trimmed = client.post('/api/auth/login', json={
        'email': 'space@example.com',
        'password': 'Mansi @ 123'
    })
    assert response_trimmed.status_code == 401

def test_email_normalization(client, app):
    client.post('/api/auth/register', json={
        'full_name': 'Mansi Sharma',
        'email': 'Norm@Example.com',
        'password': 'Mansi@123',
        'confirm_password': 'Mansi@123'
    })
    
    # Login with lowercase email should succeed (normalization works)
    response = client.post('/api/auth/login', json={
        'email': 'norm@example.com',
        'password': 'Mansi@123'
    })
    assert response.status_code == 200

def test_authenticated_identity_isolation(client, app):
    # Test 5 & 6: User identity and isolation
    client.post('/api/auth/register', json={
        'full_name': 'Mansi Sharma',
        'email': 'iso1@example.com',
        'password': 'password123',
        'confirm_password': 'password123'
    })
    
    client.post('/api/auth/register', json={
        'full_name': 'Other User',
        'email': 'iso2@example.com',
        'password': 'password123',
        'confirm_password': 'password123'
    })
    
    resp1 = client.post('/api/auth/login', json={'email': 'iso1@example.com', 'password': 'password123'})
    token1 = resp1.get_json()['access_token']
    
    me1 = client.get('/api/auth/me', headers={'Authorization': f'Bearer {token1}'})
    assert me1.get_json()['user']['email'] == 'iso1@example.com'
