import os
import pytest
from app import create_app
from app.extensions import db
from app.models import User, DailyCheckin, Activities, MoodLog, Wellbeing, JournalEntry, HabitLog, Goal, Achievement, LifeScore
from datetime import date

@pytest.fixture
def app():
    # Use testing config
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def test_app_starts(app):
    assert app is not None
    assert app.config['TESTING'] is True

def test_user_creation(app):
    user = User(full_name='Test User', email='test@example.com')
    user.set_password('password123')
    db.session.add(user)
    db.session.commit()
    
    assert user.id is not None
    assert user.check_password('password123') is True
    assert user.check_password('wrong') is False

def test_daily_checkin_and_relations(app):
    # Insert user
    user = User(full_name='Test User', email='test@example.com')
    user.set_password('password')
    db.session.add(user)
    db.session.commit()

    # Insert Checkin
    checkin = DailyCheckin(user_id=user.id, date=date(2026, 8, 9), daily_rating=8, is_completed=True)
    db.session.add(checkin)
    db.session.commit()

    assert checkin.id is not None
    assert checkin.user.email == 'test@example.com'

    # Attach related models
    activities = Activities(daily_checkin_id=checkin.id, sleep_hours=7.5, water_intake_ml=2000)
    mood = MoodLog(daily_checkin_id=checkin.id, mood_score=8, intensity=4, mood_label='😃')
    wellbeing = Wellbeing(daily_checkin_id=checkin.id, energy_level=4, focus_level=5)
    journal = JournalEntry(daily_checkin_id=checkin.id, title='Great day', content='Did a lot of work.')

    db.session.add_all([activities, mood, wellbeing, journal])
    db.session.commit()

    # Retrieve and test back_populates
    retrieved_checkin = DailyCheckin.query.get(checkin.id)
    assert retrieved_checkin.activities.sleep_hours == 7.5
    assert retrieved_checkin.mood.mood_score == 8
    assert retrieved_checkin.wellbeing.energy_level == 4
    assert retrieved_checkin.journal.title == 'Great day'

def test_duplicate_checkin_rejected(app):
    from sqlalchemy.exc import IntegrityError
    user = User(full_name='Test User', email='test2@example.com', password_hash='hash')
    db.session.add(user)
    db.session.commit()

    checkin1 = DailyCheckin(user_id=user.id, date=date(2026, 8, 9))
    db.session.add(checkin1)
    db.session.commit()

    checkin2 = DailyCheckin(user_id=user.id, date=date(2026, 8, 9))
    db.session.add(checkin2)
    with pytest.raises(IntegrityError):
        db.session.commit()
