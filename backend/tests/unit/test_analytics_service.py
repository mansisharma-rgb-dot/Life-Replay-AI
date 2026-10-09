import pytest
from app import create_app
from app.extensions import db
from app.models import User, DailyCheckin, Activities, MoodLog, LifeScore, HabitLog
from app.services.analytics_service import AnalyticsService
from datetime import date, timedelta

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
    u = User(full_name='Test', email='test@example.com')
    u.set_password('test')
    db.session.add(u)
    db.session.commit()
    return u

def test_get_overview_empty(app, user):
    res, status = AnalyticsService.get_overview(user.id, 30)
    assert status == 200
    assert res['totalCheckins'] == 0
    assert res['averageMood'] == 0.0

def test_get_overview_with_data(app, user):
    d = date.today()
    c = DailyCheckin(user_id=user.id, date=d, is_completed=True, daily_rating=8)
    db.session.add(c)
    db.session.flush()
    
    act = Activities(daily_checkin_id=c.id, study_hours=2.0, sleep_hours=8.0, water_intake_ml=2500)
    mood = MoodLog(daily_checkin_id=c.id, mood_score=9)
    ls = LifeScore(user_id=user.id, date=d, score=85)
    
    db.session.add_all([act, mood, ls])
    db.session.commit()
    
    res, status = AnalyticsService.get_overview(user.id, 30)
    assert status == 200
    assert res['totalCheckins'] == 1
    assert res['averageMood'] == 9.0
    assert res['averageSleep'] == 8.0
    assert res['averageWaterIntake'] == 2.5
    assert res['totalStudyHours'] == 2.0
    assert res['averageLifeScore'] == 85

def test_get_habit_analytics(app, user):
    d = date.today()
    c = DailyCheckin(user_id=user.id, date=d, is_completed=True)
    db.session.add(c)
    db.session.flush()
    
    h1 = HabitLog(user_id=user.id, daily_checkin_id=c.id, name='Read', completed=True)
    h2 = HabitLog(user_id=user.id, daily_checkin_id=c.id, name='Meditate', completed=False)
    
    db.session.add_all([h1, h2])
    db.session.commit()
    
    res, status = AnalyticsService.get_habit_analytics(user.id, 30)
    assert status == 200
    assert res['completionRate'] == 50
    assert len(res['habits']) == 2
    
def test_date_cutoff(app, user):
    d = date.today() - timedelta(days=40) # Outside 30 day range
    c = DailyCheckin(user_id=user.id, date=d, is_completed=True)
    db.session.add(c)
    db.session.flush()
    ls = LifeScore(user_id=user.id, date=d, score=85)
    db.session.add(ls)
    db.session.commit()
    
    res, status = AnalyticsService.get_life_score_analytics(user.id, 30)
    assert status == 200
    assert res['average'] == 0 # Out of range

def test_get_life_score_moving_average(app, user):
    d = date.today()
    scores = [10, 20, 30, 40]
    
    # Insert chronologically so they are retrieved chronologically
    for i, score in enumerate(scores):
        ls = LifeScore(user_id=user.id, date=d - timedelta(days=len(scores) - 1 - i), score=score)
        db.session.add(ls)
    
    db.session.commit()
    
    res, status = AnalyticsService.get_life_score_analytics(user.id, 30)
    assert status == 200
    
    expected_moving_averages = [10, 15, 20, 30]
    actual_moving_averages = [h['movingAverage'] for h in res['history']]
    
    assert actual_moving_averages == expected_moving_averages
