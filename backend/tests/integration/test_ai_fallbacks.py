import os
import pytest
from app import create_app
from app.extensions import db
from app.models import User, JournalEntry, Goal, Habit, HabitLog, DailyCheckin, Activities, DocumentMemory
from flask_jwt_extended import create_access_token
from datetime import date, timedelta

@pytest.fixture
def app():
    # Ensure OPENAI_API_KEY is unset for fallback testing
    old_key = os.environ.pop('OPENAI_API_KEY', None)
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()
    if old_key is not None:
        os.environ['OPENAI_API_KEY'] = old_key

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_headers(app):
    u = User(full_name='Fallback User', email='fallback@example.com')
    u.set_password('test')
    db.session.add(u)
    db.session.commit()
    
    access_token = create_access_token(identity=str(u.id))
    return {'Authorization': f'Bearer {access_token}'}, u.id

def test_correlations_fallback_without_api_key(client, auth_headers):
    headers, user_id = auth_headers
    
    # Create several checkins with varying sleep and daily ratings to produce correlation
    today = date.today()
    for i in range(10):
        d = today - timedelta(days=i)
        checkin = DailyCheckin(user_id=user_id, date=d, is_completed=True, daily_rating=5 + (i % 5))
        db.session.add(checkin)
        db.session.flush()
        act = Activities(daily_checkin_id=checkin.id, sleep_hours=6.0 + (i % 4), work_hours=4.0 + (i % 3))
        db.session.add(act)
    db.session.commit()
    
    res = client.get('/api/analytics/correlations?ai=true&timeRange=30d', headers=headers)
    assert res.status_code == 200
    data = res.get_json()
    assert 'correlations' in data
    assert 'ai_interpretation' in data
    assert "AI Interpretation is unavailable without an API key" not in data['ai_interpretation']
    assert len(data['ai_interpretation']) > 0

def test_time_analysis_fallback_without_api_key(client, auth_headers):
    headers, user_id = auth_headers
    
    today = date.today()
    for i in range(5):
        d = today - timedelta(days=i)
        checkin = DailyCheckin(user_id=user_id, date=d, is_completed=True)
        db.session.add(checkin)
        db.session.flush()
        act = Activities(daily_checkin_id=checkin.id, work_hours=5.0, study_hours=2.0, leisure_hours=1.0, screen_time_minutes=60)
        db.session.add(act)
    db.session.commit()
    
    res = client.get('/api/analytics/time-analysis?ai=true&timeRange=30d', headers=headers)
    assert res.status_code == 200
    data = res.get_json()
    assert 'summary' in data
    assert 'ai_insight' in data
    assert data['ai_insight'] is not None
    assert "AI Interpretation is unavailable without an API key" not in data['ai_insight']
    assert "tracked hours" in data['ai_insight'] or "productive" in data['ai_insight'].lower()

def test_ai_replay_without_api_key(client, auth_headers):
    headers, user_id = auth_headers
    
    # Add real journal, goal, habit
    checkin = DailyCheckin(user_id=user_id, date=date.today(), is_completed=True)
    db.session.add(checkin)
    db.session.flush()
    
    journal = JournalEntry(daily_checkin_id=checkin.id, title="Python Journey", content="Started learning advanced algorithms today.")
    db.session.add(journal)
    
    goal = Goal(user_id=user_id, title="Master Python Backend", category="Technical", progress=50.0, target=100.0)
    db.session.add(goal)
    
    habit = Habit(user_id=user_id, name="Daily Coding", frequency="daily")
    db.session.add(habit)
    db.session.commit()
    
    res = client.post('/api/ai/replay', headers=headers, json={"query": "What did I do related to Python?"})
    assert res.status_code == 200
    data = res.get_json()
    assert 'answer' in data
    assert 'sources' in data
    assert data.get('ai_available') is False
    assert "placeholder response" not in data['answer'].lower()
    assert len(data['sources']) > 0
    # Verify sources contain actual matching records
    source_titles = [s['title'] for s in data['sources']]
    assert any("Python" in t for t in source_titles)

def test_ai_replay_empty_results(client, auth_headers):
    headers, user_id = auth_headers
    
    res = client.post('/api/ai/replay', headers=headers, json={"query": "Quantum Astronomy Rocket Launch"})
    assert res.status_code == 200
    data = res.get_json()
    assert 'answer' in data
    assert "No recorded memories" in data['answer']
    assert data['sources'] == []

def test_ai_replay_user_isolation(client, app, auth_headers):
    headers1, user1_id = auth_headers
    
    # User 1 secret journal
    c1 = DailyCheckin(user_id=user1_id, date=date.today(), is_completed=True)
    db.session.add(c1)
    db.session.flush()
    j1 = JournalEntry(daily_checkin_id=c1.id, title="User1 Secret Strategy", content="Confidential business plans.")
    db.session.add(j1)
    db.session.commit()
    
    # Create User 2
    with app.app_context():
        u2 = User(full_name='User Two', email='user2_replay@example.com')
        u2.set_password('test')
        db.session.add(u2)
        db.session.commit()
        u2_id = u2.id
        
    token2 = create_access_token(identity=str(u2_id))
    headers2 = {'Authorization': f'Bearer {token2}'}
    
    # User 2 queries for secret strategy
    res2 = client.post('/api/ai/replay', headers=headers2, json={"query": "User1 Secret Strategy"})
    assert res2.status_code == 200
    data2 = res2.get_json()
    assert "No recorded memories" in data2['answer']
    assert data2['sources'] == []
