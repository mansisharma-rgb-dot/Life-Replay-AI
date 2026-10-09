import pytest
from unittest.mock import patch
from datetime import date, timedelta
from app.models import User, DailyCheckin, Activities
from app.extensions import db
from app import create_app

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
def auth_headers(client, app):
    # Register and login user
    user = User(email='ai@test.com', full_name='AI User', password_hash='hash')
    db.session.add(user)
    db.session.commit()
    
    # Add checkins to have some data
    today = date.today()
    for i in range(5):
        c = DailyCheckin(user_id=user.id, date=today - timedelta(days=i), is_completed=True)
        db.session.add(c)
        db.session.commit()
        db.session.add(Activities(daily_checkin_id=c.id, sleep_hours=8))
    db.session.commit()
    
    from flask_jwt_extended import create_access_token
    token = create_access_token(identity=str(user.id))
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def empty_user_headers(client, app):
    user = User(email='empty@test.com', full_name='Empty User', password_hash='hash')
    db.session.add(user)
    db.session.commit()
    
    from flask_jwt_extended import create_access_token
    token = create_access_token(identity=str(user.id))
    return {'Authorization': f'Bearer {token}'}

def test_unauthorized_endpoints(client):
    # 2, 4, 6. Unauthorized endpoints
    res_insights = client.get('/api/ai/insights')
    res_recs = client.get('/api/ai/recommendations')
    res_over = client.get('/api/ai/overview')
    res_replay = client.post('/api/ai/replay', json={"query": "test"})
    
    assert res_insights.status_code == 401
    assert res_recs.status_code == 401
    assert res_over.status_code == 401
    assert res_replay.status_code == 401

def test_authenticated_insights(client, auth_headers):
    # 1. Insights endpoint authenticated
    # 16. Response contract
    res = client.get('/api/ai/insights', headers=auth_headers)
    assert res.status_code == 200
    
    data = res.get_json()
    assert "summary" in data
    assert "insights" in data
    assert isinstance(data["insights"], list)

def test_authenticated_recommendations(client, auth_headers):
    # 3. Recommendations endpoint authenticated
    # 16. Response contract
    res = client.get('/api/ai/recommendations', headers=auth_headers)
    assert res.status_code == 200
    
    data = res.get_json()
    assert "recommendations" in data
    assert isinstance(data["recommendations"], list)

def test_authenticated_overview(client, auth_headers):
    # 5. Overview endpoint authenticated
    # 16. Response contract
    res = client.get('/api/ai/overview', headers=auth_headers)
    assert res.status_code == 200
    
    data = res.get_json()
    assert "insights" in data
    assert "recommendations" in data
    assert "period" in data

def test_http_method_rejection(client, auth_headers):
    # 17. HTTP method rejection
    res = client.post('/api/ai/insights', headers=auth_headers)
    assert res.status_code == 405
    res = client.put('/api/ai/recommendations', headers=auth_headers)
    assert res.status_code == 405

def test_time_ranges(client, auth_headers):
    # 10, 11, 12, 13, 14. Time ranges
    ranges = ['7d', '30d', '90d', '1y']
    for r in ranges:
        res = client.get(f'/api/ai/recommendations?timeRange={r}', headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["period"]["days"] in [7, 30, 90, 365]

    # Invalid range should default to 30d
    res = client.get('/api/ai/recommendations?timeRange=invalid', headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()["period"]["days"] == 30

def test_empty_user(client, empty_user_headers):
    # 9. Empty user
    res = client.get('/api/ai/overview', headers=empty_user_headers)
    assert res.status_code == 200
    
    data = res.get_json()
    assert "More check-ins are needed" in data["insights"]["summary"]
    assert len(data["insights"]["insights"]) == 0

def test_user_isolation_and_idor(client, auth_headers):
    # 7. User isolation, 8. IDOR query parameter protection
    # Make a request trying to access user 999 (should be ignored due to JWT)
    res = client.get('/api/ai/overview?user_id=999', headers=auth_headers)
    assert res.status_code == 200
    
    data = res.get_json()
    # auth_headers belongs to a user with 5 checkins, so it will have recommendations/insights
    # If IDOR succeeded, it would fail or return empty user data.
    assert "More check-ins are needed" not in data["insights"]["summary"]

@patch('app.routes.ai.AIInsightService.generate_personalized_insights')
def test_service_failure_handling(mock_generate, client, auth_headers):
    # 15. Service failure handling
    mock_generate.side_effect = Exception("Internal explosion")
    
    res = client.get('/api/ai/insights', headers=auth_headers)
    assert res.status_code == 500
    data = res.get_json()
    assert "error" in data
    assert "Internal explosion" not in data.get("error") # Ensure we don't leak internal traces
    
    res2 = client.get('/api/ai/overview', headers=auth_headers)
    assert res2.status_code == 500

def test_authenticated_replay(client, auth_headers):
    # Test valid replay POST
    res = client.post('/api/ai/replay', headers=auth_headers, json={"query": "What did I do in July?"})
    assert res.status_code == 200
    data = res.get_json()
    assert "answer" in data
    assert "sources" in data
    assert "context" in data

def test_replay_missing_query(client, auth_headers):
    # Test missing query
    res = client.post('/api/ai/replay', headers=auth_headers, json={})
    assert res.status_code == 400
    data = res.get_json()
    assert "error" in data
