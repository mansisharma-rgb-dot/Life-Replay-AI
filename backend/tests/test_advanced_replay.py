import pytest
from datetime import datetime, date, timezone
from app import create_app
from app.models import (
    User, DailyCheckin, DocumentMemory, JournalEntry, Goal, 
    Habit, Skill, Achievement, MoodLog, Activities
)
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
def token_headers(app, test_user):
    with app.app_context():
        token = create_access_token(identity=str(test_user))
        return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def test_user(app):
    with app.app_context():
        user = User(
            email="test_replay@example.com", 
            full_name="Test Replay"
        )
        user.set_password("hash")
        db.session.add(user)
        db.session.commit()
        return user.id

@pytest.fixture
def replay_data(app, test_user):
    with app.app_context():
        # Add some diverse data
        checkin1 = DailyCheckin(user_id=test_user, date=date(2026, 7, 10))
        checkin2 = DailyCheckin(user_id=test_user, date=date(2026, 8, 15))
        db.session.add_all([checkin1, checkin2])
        db.session.commit()
        
        mood1 = MoodLog(daily_checkin_id=checkin1.id, mood_score=8, mood_label="Happy")
        mood2 = MoodLog(daily_checkin_id=checkin2.id, mood_score=4, mood_label="Stressed")
        db.session.add_all([mood1, mood2])
        
        doc1 = DocumentMemory(user_id=test_user, title="Python Notes", status="processed", filename="fake1.pdf", original_name="fake1.pdf", file_type="pdf", file_size=10)
        doc2 = DocumentMemory(user_id=test_user, title="Exam Prep", status="processed", filename="fake2.pdf", original_name="fake2.pdf", file_type="pdf", file_size=10)
        db.session.add_all([doc1, doc2])
        
        journal1 = JournalEntry(daily_checkin_id=checkin1.id, title="Great Day", content="Studied Python a lot today.")
        journal2 = JournalEntry(daily_checkin_id=checkin2.id, title="Stressful Day", content="Exams are coming up soon.")
        db.session.add_all([journal1, journal2])
        
        goal1 = Goal(user_id=test_user, title="Learn Python")
        goal2 = Goal(user_id=test_user, title="Pass Exams")
        db.session.add_all([goal1, goal2])
        
        habit1 = Habit(user_id=test_user, name="Read Books", frequency="daily")
        db.session.add(habit1)
        
        ach1 = Achievement(user_id=test_user, name="Python Master", description="Completed 100 hours")
        db.session.add(ach1)

        db.session.commit()
        
        yield test_user

def test_ai_replay_general(client, token_headers, replay_data, monkeypatch):
    monkeypatch.setattr('app.services.llm_service.LLMService.extract_query_intent', lambda q: {
        'intent': 'GENERAL_REPLAY',
        'search_terms': [],
        'start_date': None,
        'end_date': None
    })
    
    monkeypatch.setattr('app.services.llm_service.LLMService.generate_advanced_replay', lambda q, c, i, user_preferences=None: {
        "answer": "This is a mocked replay response.",
        "sources": [{"type": "Document", "title": "Python Notes"}]
    })

    res = client.post('/api/ai/replay', headers=token_headers, json={
        "query": "What happened recently?"
    })

    assert res.status_code == 200
    data = res.get_json()
    assert "answer" in data
    assert "context" in data
    assert len(data['context']['documents']) == 2
    assert len(data['context']['timeline']) == 2
    assert len(data['context']['goals']) == 2
    assert len(data['context']['achievements']) == 1

def test_ai_replay_topic(client, token_headers, replay_data, monkeypatch):
    monkeypatch.setattr('app.services.llm_service.LLMService.extract_query_intent', lambda q: {
        'intent': 'TOPIC',
        'search_terms': ['Python'],
        'start_date': None,
        'end_date': None
    })
    monkeypatch.setattr('app.services.llm_service.LLMService.generate_advanced_replay', lambda q, c, i, user_preferences=None: {})

    res = client.post('/api/ai/replay', headers=token_headers, json={
        "query": "What was I doing with Python?"
    })

    assert res.status_code == 200
    data = res.get_json()
    assert len(data['context']['documents']) == 1
    assert data['context']['documents'][0]['title'] == 'Python Notes'
    assert len(data['context']['journals']) == 1
    assert data['context']['journals'][0]['title'] == 'Great Day'
    assert len(data['context']['goals']) == 1

def test_ai_replay_comparison(client, token_headers, replay_data, monkeypatch):
    monkeypatch.setattr('app.services.llm_service.LLMService.extract_query_intent', lambda q: {
        'intent': 'COMPARISON',
        'search_terms': [],
        'start_date': '2026-07-01',
        'end_date': '2026-08-30'
    })
    monkeypatch.setattr('app.services.llm_service.LLMService.generate_advanced_replay', lambda q, c, i, user_preferences=None: {})

    res = client.post('/api/ai/replay', headers=token_headers, json={
        "query": "Compare July and August"
    })

    assert res.status_code == 200
    data = res.get_json()
    context = data['context']
    assert 'comparison_stats' in context
    # avg of 8 and 4 = 6.0
    assert context['comparison_stats']['timeline_average_mood_score'] == 6.0
    assert context['comparison_stats']['total_timeline_events'] == 2

def test_ai_replay_empty(client, token_headers, replay_data, monkeypatch):
    monkeypatch.setattr('app.services.llm_service.LLMService.extract_query_intent', lambda q: {
        'intent': 'TOPIC',
        'search_terms': ['Supercalifragilisticexpialidocious'],
        'start_date': None,
        'end_date': None
    })
    monkeypatch.setattr('app.services.llm_service.LLMService.generate_advanced_replay', lambda q, c, i, user_preferences=None: {})

    res = client.post('/api/ai/replay', headers=token_headers, json={
        "query": "Something that doesn't exist"
    })

    assert res.status_code == 200
    data = res.get_json()
    assert len(data['context']['documents']) == 0
    assert len(data['context']['journals']) == 0

def test_ai_replay_ai_unavailable(client, token_headers, replay_data, monkeypatch):
    # Simulate AI unavailable by forcing the API key to be None inside the route execution context
    monkeypatch.setattr('os.environ.get', lambda k, default=None: None if k == 'OPENAI_API_KEY' else default)
    
    res = client.post('/api/ai/replay', headers=token_headers, json={
        "query": "What happened with Python notes and exams?"
    })

    assert res.status_code == 200
    data = res.get_json()
    assert data.get('ai_available') is False
    assert "placeholder response" not in data['answer'].lower()
    assert len(data['sources']) > 0
    assert any("Python Notes" in s.get('title', '') for s in data['sources'])

def test_user_isolation(client, token_headers, app):
    # Create another user's data
    with app.app_context():
        other = User(email="other@example.com", full_name="O O")
        other.set_password("hash")
        db.session.add(other)
        db.session.commit()
        db.session.refresh(other)
        
        db.session.add(Goal(user_id=other.id, title="Other's Secret Goal"))
        db.session.commit()

    res = client.post('/api/ai/replay', headers=token_headers, json={"query": "Goals"})
    assert res.status_code == 200
    data = res.get_json()
    
    # ensure "Other's Secret Goal" is not in context
    for g in data['context']['goals']:
        assert "Other's Secret Goal" not in g['title']
