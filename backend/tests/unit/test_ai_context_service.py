import json
import pytest
from datetime import date, timedelta
from app import create_app
from app.services.ai_context_service import AIContextService
from app.models import User, DailyCheckin, Activities, MoodLog, JournalEntry, LifeScore, HabitLog, Goal, Achievement
from app.extensions import db

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

def test_empty_user(app):
    # Test 1: Empty user
    u = User(full_name='Empty User', email='empty@test.com', password_hash='hash')
    db.session.add(u)
    db.session.commit()
    
    context = AIContextService.build_user_context(u.id, 30)
    
    assert context['user']['id'] == u.id
    assert context['user']['total_xp'] == 0
    assert context['life_score']['average'] == 0
    assert len(context['life_score']['history']) == 0
    assert len(context['mood']['history']) == 0
    assert len(context['sleep']['history']) == 0
    assert len(context['water']['history']) == 0
    assert len(context['habits']['history']) == 0
    assert context['goals']['completed'] == 0
    assert len(context['achievements']['recent']) == 0
    assert len(context['journal']['entries']) == 0

def test_user_with_known_data(app):
    # Test 2: Known data determinism
    u = User(full_name='Known', email='known@test.com', password_hash='hash', level=5, total_xp=500, current_streak=3, longest_streak=10)
    db.session.add(u)
    db.session.commit()
    
    d = date.today()
    c = DailyCheckin(user_id=u.id, date=d, is_completed=True)
    db.session.add(c)
    db.session.commit()
    
    act = Activities(daily_checkin_id=c.id, sleep_hours=8, water_intake_ml=2000, study_hours=2, work_hours=4, screen_time_minutes=120)
    mood = MoodLog(daily_checkin_id=c.id, mood_score=8, intensity=4, note='Good day')
    journal = JournalEntry(daily_checkin_id=c.id, title='Day 1', content='Was productive.')
    db.session.add_all([act, mood, journal])
    
    ls = LifeScore(user_id=u.id, date=d, score=85)
    goal = Goal(user_id=u.id, title='Run 5k', progress=5.0, target=5.0, category='Fitness')
    ach = Achievement(user_id=u.id, name='First Run', description='Ran 5k', icon='🏃')
    habit = HabitLog(user_id=u.id, daily_checkin_id=c.id, name='Read', completed=True)
    db.session.add_all([ls, goal, ach, habit])
    db.session.commit()
    
    context = AIContextService.build_user_context(u.id, 7)
    
    assert context['user']['level'] == 5
    assert context['user']['current_streak'] == 3
    assert context['sleep']['average_hours'] == 8.0
    assert context['water']['average_intake_ml'] == 2000
    assert context['productivity']['study_hours'] == 2
    assert context['productivity']['work_hours'] == 4
    assert context['mood']['average'] == 8.0
    assert context['mood']['distribution']['7-8'] == 1
    assert context['life_score']['highest'] == 85
    assert context['goals']['completed'] == 1
    assert context['achievements']['unlocked'] == 1
    assert context['habits']['completion_rate'] == 100
    assert len(context['journal']['entries']) == 1
    assert context['journal']['entries'][0]['title'] == 'Day 1'
    
    # Test 4: Serialization
    json_str = json.dumps(context)
    assert '85' in json_str
    
    # Test 5: Determinism
    context2 = AIContextService.build_user_context(u.id, 7)
    assert context == context2

def test_date_filtering(app):
    # Test 3: Date filtering
    u = User(full_name='Date Filter', email='date@test.com', password_hash='hash')
    db.session.add(u)
    db.session.commit()
    
    today = date.today()
    out_of_range = today - timedelta(days=40)
    
    c_in = DailyCheckin(user_id=u.id, date=today, is_completed=True)
    c_out = DailyCheckin(user_id=u.id, date=out_of_range, is_completed=True)
    db.session.add_all([c_in, c_out])
    db.session.commit()
    
    db.session.add(Activities(daily_checkin_id=c_in.id, sleep_hours=8))
    db.session.add(Activities(daily_checkin_id=c_out.id, sleep_hours=4)) # Out of range
    db.session.commit()
    
    context = AIContextService.build_user_context(u.id, 30)
    assert len(context['sleep']['history']) == 1
    assert context['sleep']['history'][0]['hours'] == 8
    assert context['sleep']['average_hours'] == 8.0

def test_user_isolation(app):
    # Test 6: User Isolation
    u_a = User(full_name='User A', email='a@test.com', password_hash='hash')
    u_b = User(full_name='User B', email='b@test.com', password_hash='hash')
    db.session.add_all([u_a, u_b])
    db.session.commit()
    
    d = date.today()
    c_a = DailyCheckin(user_id=u_a.id, date=d, is_completed=True)
    c_b = DailyCheckin(user_id=u_b.id, date=d, is_completed=True)
    db.session.add_all([c_a, c_b])
    db.session.commit()
    
    db.session.add(Activities(daily_checkin_id=c_a.id, sleep_hours=9))
    db.session.add(Activities(daily_checkin_id=c_b.id, sleep_hours=2))
    db.session.commit()
    
    context_a = AIContextService.build_user_context(u_a.id, 30)
    assert context_a['sleep']['average_hours'] == 9.0
    
    context_b = AIContextService.build_user_context(u_b.id, 30)
    assert context_b['sleep']['average_hours'] == 2.0

def test_missing_optional_data(app):
    # Test 7: Missing optional data
    u = User(full_name='Missing', email='missing@test.com', password_hash='hash')
    db.session.add(u)
    db.session.commit()
    
    c = DailyCheckin(user_id=u.id, date=date.today(), is_completed=True)
    db.session.add(c)
    db.session.commit()
    
    act = Activities(daily_checkin_id=c.id, study_hours=5) # No sleep/water
    # NO Journal, NO Mood, NO Habits, NO Achievements
    db.session.add(act)
    db.session.commit()
    
    context = AIContextService.build_user_context(u.id, 30)
    assert context['productivity']['study_hours'] == 5
    assert len(context['journal']['entries']) == 0
    assert len(context['achievements']['recent']) == 0
    assert context['sleep']['average_hours'] == 0
