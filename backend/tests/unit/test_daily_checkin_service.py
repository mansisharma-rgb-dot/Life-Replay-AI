import pytest
from app import create_app
from app.extensions import db
from app.models import User, DailyCheckin, LifeScore
from app.services.daily_checkin_service import DailyCheckinService
from datetime import date

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
def user(app):
    u = User(full_name='Test', email='test@example.com')
    u.set_password('test')
    db.session.add(u)
    db.session.commit()
    return u

def test_get_today_empty(app, user):
    res, status = DailyCheckinService.get_today(user.id)
    assert status == 200
    assert res['is_completed'] is False
    assert res['daily_rating'] == 0

def test_upsert_draft_does_not_award_xp(app, user):
    data = {
        'is_completed': False,
        'activities': {'sleep_hours': 8}
    }
    res, status = DailyCheckinService.upsert_checkin(user.id, data)
    assert status == 200
    assert res['is_completed'] is False
    assert res['activities']['sleep_hours'] == 8
    
    # Check XP not awarded
    u = User.query.get(user.id)
    assert u.total_xp == 0
    
    # Life Score not created yet
    ls = LifeScore.query.filter_by(user_id=user.id).first()
    assert ls is None

def test_upsert_completion_awards_xp_and_streak(app, user):
    data = {
        'is_completed': True,
        'activities': {'sleep_hours': 8, 'study_hours': 4},
        'mood': {'mood_score': 8}
    }
    res, status = DailyCheckinService.upsert_checkin(user.id, data)
    assert status == 200
    assert res['is_completed'] is True
    
    u = User.query.get(user.id)
    assert u.total_xp >= 10
    assert u.current_streak == 1
    
    ls = LifeScore.query.filter_by(user_id=user.id).first()
    assert ls is not None
    assert ls.score > 0

def test_upsert_repeated_completion_no_double_xp(app, user):
    data = {'is_completed': True}
    DailyCheckinService.upsert_checkin(user.id, data)
    
    u = User.query.get(user.id)
    initial_xp = u.total_xp
    assert initial_xp >= 10
    
    # Do it again
    DailyCheckinService.upsert_checkin(user.id, data)
    u = User.query.get(user.id)
    assert u.total_xp == initial_xp # No double XP

def test_get_history(app, user):
    data = {'is_completed': True, 'daily_rating': 8}
    DailyCheckinService.upsert_checkin(user.id, data)
    
    res, status = DailyCheckinService.get_history(user.id)
    assert status == 200
    assert res['total'] == 1
    assert len(res['items']) == 1
    assert res['items'][0]['daily_rating'] == 8
