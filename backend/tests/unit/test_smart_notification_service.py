import pytest
from datetime import date, timedelta
from app.services.smart_notification_service import SmartNotificationService
from app.models import Notification, DailyCheckin, Activities, Wellbeing, HabitLog, Habit, Goal, User
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

def test_habit_risk_detection(app):
    u = User(full_name='Test', email='test@test.com', password_hash='hash')
    db.session.add(u)
    db.session.commit()
    
    h = Habit(user_id=u.id, name='Read', frequency='daily')
    db.session.add(h)
    db.session.commit()
    
    today = date.today()
    # 5 completions in last 7 days (not today)
    for i in range(1, 6):
        c = DailyCheckin(user_id=u.id, date=today - timedelta(days=i), is_completed=True)
        db.session.add(c)
        db.session.commit()
        db.session.add(HabitLog(user_id=u.id, habit_id=h.id, name=h.name, daily_checkin_id=c.id, completed=True))
    db.session.commit()
    
    # Run service
    notifs = SmartNotificationService.check_habit_risk(u.id)
    assert len(notifs) == 1
    assert notifs[0].severity == "WARNING"
    assert notifs[0].type == "habit_risk"
    
    # Duplicate prevention test
    notifs2 = SmartNotificationService.check_habit_risk(u.id)
    assert len(notifs2) == 0 # Should prevent duplicate
    
def test_insufficient_data(app):
    u = User(full_name='Empty', email='empty@test.com', password_hash='hash')
    db.session.add(u)
    db.session.commit()
    
    # 0 data should return empty arrays for all
    assert len(SmartNotificationService.check_habit_risk(u.id)) == 0
    assert len(SmartNotificationService.check_productivity_decline(u.id)) == 0
    assert len(SmartNotificationService.check_focus_decline(u.id)) == 0
    assert len(SmartNotificationService.check_sleep_pattern(u.id)) == 0

def test_sleep_pattern_decline(app):
    u = User(full_name='Sleepy', email='sleepy@test.com', password_hash='hash')
    db.session.add(u)
    db.session.commit()
    
    today = date.today()
    
    # 13 days of 8 hours sleep
    for i in range(1, 14):
        c = DailyCheckin(user_id=u.id, date=today - timedelta(days=i), is_completed=True)
        db.session.add(c)
        db.session.commit()
        db.session.add(Activities(daily_checkin_id=c.id, sleep_hours=8.0))
        
    # Today: 4 hours
    c_today = DailyCheckin(user_id=u.id, date=today, is_completed=True)
    db.session.add(c_today)
    db.session.commit()
    db.session.add(Activities(daily_checkin_id=c_today.id, sleep_hours=4.0))
    db.session.commit()
    
    notifs = SmartNotificationService.check_sleep_pattern(u.id)
    assert len(notifs) == 1
    assert notifs[0].severity == "IMPORTANT"
    assert "Noticeable sleep reduction" in notifs[0].title

def test_user_isolation(app):
    u1 = User(full_name='U1', email='u1@test.com', password_hash='hash')
    u2 = User(full_name='U2', email='u2@test.com', password_hash='hash')
    db.session.add_all([u1, u2])
    db.session.commit()
    
    today = date.today()
    # U1 gets focus decline
    for i in range(5):
        c = DailyCheckin(user_id=u1.id, date=today - timedelta(days=i), is_completed=True)
        db.session.add(c)
        db.session.commit()
        # [2, 2, 3, 4, 4] means today is 2, yesterday 2, etc. This triggers focus decline
        focus = [2, 2, 3, 4, 4][i]
        db.session.add(Wellbeing(daily_checkin_id=c.id, focus_level=focus))
    db.session.commit()
    
    # Ensure U2 has 0 notifications
    n2 = SmartNotificationService.check_focus_decline(u2.id)
    assert len(n2) == 0
    
    # Ensure U1 has 1
    n1 = SmartNotificationService.check_focus_decline(u1.id)
    assert len(n1) == 1
