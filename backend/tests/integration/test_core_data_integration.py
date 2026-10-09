import pytest
import io
import os
import json
from datetime import date, timedelta, datetime
from app import create_app
from app.extensions import db
from app.models import (
    User, DailyCheckin, Activities, MoodLog, Wellbeing,
    JournalEntry, LifeScore, Habit, HabitLog, DocumentMemory, Goal, Skill, Achievement
)
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
def auth_user(app):
    with app.app_context():
        user = User(full_name='Integration Tester', email='tester@example.com')
        user.set_password('Password123!')
        db.session.add(user)
        db.session.commit()
        
        token = create_access_token(identity=str(user.id))
        return {'Authorization': f'Bearer {token}'}, user.id

def test_achievements_evaluation_and_unlocking(client, app, auth_user):
    headers, user_id = auth_user
    today = date.today()
    
    with app.app_context():
        # Add 1 completed checkin
        c = DailyCheckin(user_id=user_id, date=today, is_completed=True, daily_rating=9)
        db.session.add(c)
        
        # Add 1 completed goal
        g = Goal(user_id=user_id, title="Launch Project", category="Work", progress=100, target=100, status="completed")
        db.session.add(g)
        
        # Add 1 skill with level 5
        s = Skill(user_id=user_id, name="Python Programming", category="Technical", level=5, progress=20)
        db.session.add(s)
        
        db.session.commit()

    # Query achievements endpoint
    res = client.get('/api/analytics/achievements', headers=headers)
    assert res.status_code == 200
    
    # Query dedicated achievement service
    from app.services.achievement_service import AchievementService
    with app.app_context():
        achievements = AchievementService.get_user_achievements(user_id)
        unlocked = {a['name']: a for a in achievements if a['is_unlocked']}
        
        # Verify First Step is unlocked
        assert 'First Step' in unlocked
        assert unlocked['First Step']['is_unlocked'] == True
        assert unlocked['First Step']['unlocked_at'] is not None
        
        # Verify Goal Crusher is unlocked
        assert 'Goal Crusher' in unlocked
        
        # Verify Apprentice is unlocked
        assert 'Apprentice' in unlocked

def test_ai_replay_goal_and_content_synthesis(client, app, auth_user):
    headers, user_id = auth_user
    
    with app.app_context():
        g1 = Goal(user_id=user_id, title="College Project", category="Education", progress=75, target=100, status="in_progress")
        g2 = Goal(user_id=user_id, title="Project Documentation", category="Work", progress=50, target=100, status="in_progress")
        db.session.add_all([g1, g2])
        db.session.commit()
        
    res = client.post('/api/ai/replay', headers=headers, json={"query": "What goals was I working toward?"})
    assert res.status_code == 200
    data = res.get_json()
    assert 'answer' in data
    assert 'sources' in data
    # Answer should contain real goal titles
    assert "College Project" in data['answer']
    assert "Project Documentation" in data['answer']
    assert len(data['sources']) >= 2

def test_weekly_and_monthly_reports(client, app, auth_user):
    headers, user_id = auth_user
    test_month_date = date(2026, 8, 20)
    
    with app.app_context():
        for i in range(7):
            d = test_month_date - timedelta(days=i)
            c = DailyCheckin(user_id=user_id, date=d, is_completed=True, daily_rating=8)
            db.session.add(c)
            db.session.flush()
            
            act = Activities(daily_checkin_id=c.id, study_hours=2.5, work_hours=3.0, sleep_hours=7.0, water_intake_ml=2000)
            db.session.add(act)
            
            m = MoodLog(daily_checkin_id=c.id, mood_score=8, mood_label='😊')
            db.session.add(m)
            
            ls = LifeScore(user_id=user_id, date=d, score=82)
            db.session.add(ls)
            
        db.session.commit()

    # 1. Test Monthly Report
    m_res = client.get(f'/api/reports/monthly?year=2026&month=8', headers=headers)
    assert m_res.status_code == 200
    m_data = m_res.get_json()
    assert m_data['empty'] == False
    assert m_data['metrics']['total_checkin_days'] == 7
    assert m_data['metrics']['average_life_score'] == 82
    assert m_data['narrative'] is not None

    # 2. Test Weekly Report
    w_res = client.get('/api/reports/weekly?start_date=2026-08-14&end_date=2026-08-20', headers=headers)
    assert w_res.status_code == 200
    w_data = w_res.get_json()
    assert w_data['empty'] == False
    assert w_data['metrics']['total_checkin_days'] == 7
    assert w_data['narrative'] is not None

def test_user_data_isolation(client, app, auth_user):
    headers1, user1_id = auth_user
    
    # Create second user
    with app.app_context():
        user2 = User(full_name='User Two', email='user2@example.com')
        user2.set_password('Password123!')
        db.session.add(user2)
        db.session.commit()
        token2 = create_access_token(identity=str(user2.id))
        headers2 = {'Authorization': f'Bearer {token2}'}
        
        # User 1 goal
        g1 = Goal(user_id=user1_id, title="User One Private Goal", category="Personal", progress=10, target=100)
        # User 2 goal
        g2 = Goal(user_id=user2.id, title="User Two Private Goal", category="Work", progress=20, target=100)
        db.session.add_all([g1, g2])
        db.session.commit()

    # User 1 replay should never see User 2's goal
    res1 = client.post('/api/ai/replay', headers=headers1, json={"query": "What goals was I working on?"})
    assert res1.status_code == 200
    ans1 = res1.get_json()['answer']
    assert "User One Private Goal" in ans1
    assert "User Two Private Goal" not in ans1
