import pytest
from datetime import date, datetime
from app import create_app
from app.models import User, DailyCheckin, Activities, MoodLog, Goal, Achievement, JournalEntry, DocumentMemory
from app.extensions import db
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
def test_user(app):
    with app.app_context():
        user = User(full_name='Test User', email='test@example.com')
        user.set_password('password123')
        db.session.add(user)
        db.session.commit()
        return {"id": user.id}

@pytest.fixture
def auth_headers(app, test_user):
    with app.app_context():
        access_token = create_access_token(identity=str(test_user["id"]))
        return {'Authorization': f'Bearer {access_token}'}

def test_monthly_report_empty(client, app, auth_headers):
    """Test getting a monthly report when there is no data."""
    # We use month=1, year=2020 which has no data
    response = client.get('/api/reports/monthly?year=2020&month=1', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert data['empty'] == True
    assert data['metrics'] is None
    
def test_monthly_report_populated(client, app, auth_headers, test_user):
    """Test getting a monthly report with some populated data."""
    with app.app_context():
        # Setup data for August 2026
        checkin_date = date(2026, 8, 15)
        chk = DailyCheckin(user_id=test_user["id"], date=checkin_date, daily_rating=4, is_completed=True)
        db.session.add(chk)
        db.session.commit()
        
        act = Activities(daily_checkin_id=chk.id, study_hours=2, work_hours=4, sleep_hours=7)
        db.session.add(act)
        
        mood = MoodLog(daily_checkin_id=chk.id, mood_score=8)
        db.session.add(mood)
        db.session.commit()
        
    response = client.get('/api/reports/monthly?year=2026&month=8', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    
    assert data['empty'] == False
    assert data['metrics']['total_checkin_days'] == 1
    assert data['metrics']['total_study_hours'] == 2.0
    assert data['metrics']['average_sleep_hours'] == 7.0
    assert data['metrics']['average_mood'] == 8.0
    
    # Assert narrative fallback is local and contains no OpenAI API key warnings
    assert data['narrative'] is not None
    reflection = data['narrative']['answer']['reflection']
    assert "OPENAI_API_KEY" not in reflection
    assert "Please set OPENAI_API_KEY" not in reflection
    assert len(reflection) > 10

def test_monthly_report_user_isolation(client, app, auth_headers, test_user):
    """Test that the report only fetches data for the logged-in user."""
    with app.app_context():
        # Create a second user and add data for them
        other_user = User(full_name="other", email="other@test.com")
        other_user.set_password("pass")
        db.session.add(other_user)
        db.session.commit()
        
        checkin_date = date(2026, 8, 16)
        chk = DailyCheckin(user_id=other_user.id, date=checkin_date, daily_rating=5, is_completed=True)
        db.session.add(chk)
        db.session.commit()
        
        # Add one for the test_user so their report is not empty
        chk_test = DailyCheckin(user_id=test_user["id"], date=checkin_date, daily_rating=4, is_completed=True)
        db.session.add(chk_test)
        db.session.commit()

    # Logged-in user's report should NOT contain other_user's data
    response = client.get('/api/reports/monthly?year=2026&month=8', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    
    # We added one record for test_user in previous test, so it should be exactly 1
    assert data['metrics']['total_checkin_days'] == 1

def test_range_report(client, app, auth_headers, test_user):
    """Test getting a custom date-range report."""
    with app.app_context():
        checkin_date = date(2026, 8, 15)
        chk = DailyCheckin(user_id=test_user["id"], date=checkin_date, daily_rating=4, is_completed=True)
        db.session.add(chk)
        db.session.commit()

        act = Activities(daily_checkin_id=chk.id, study_hours=3, work_hours=2, sleep_hours=8)
        db.session.add(act)
        mood = MoodLog(daily_checkin_id=chk.id, mood_score=9)
        db.session.add(mood)
        db.session.commit()

    response = client.get('/api/reports/range?start_date=2026-08-01&end_date=2026-08-31', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert 'metrics' in data
    assert 'period' in data
    assert data['empty'] is False
    assert data['metrics']['total_checkin_days'] >= 1
    assert data['metrics']['total_study_hours'] == 3.0
