import pytest
from app.services.gamification_service import GamificationService
from app import create_app
from app.extensions import db
from app.models import User, GamificationEvent, Notification

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

def test_calculate_level():
    # Test level calculation based on deterministic formula
    assert GamificationService.calculate_level(0)["level"] == 1
    assert GamificationService.calculate_level(10)["level"] == 1
    assert GamificationService.calculate_level(100)["level"] == 2
    assert GamificationService.calculate_level(150)["level"] == 2
    assert GamificationService.calculate_level(250)["level"] == 3
    assert GamificationService.calculate_level(450)["level"] == 4
    assert GamificationService.calculate_level(700)["level"] == 5

def test_calculate_level_progress():
    # Test progress percent logic
    res = GamificationService.calculate_level(50) # Level 1, 50/100 XP
    assert res["level"] == 1
    assert res["progress_percent"] == 50.0
    
    res = GamificationService.calculate_level(175) # Level 2, between 100 and 250 XP -> 75/150 XP
    assert res["level"] == 2
    assert res["current_level_xp"] == 75
    assert res["progress_percent"] == 50.0

def test_award_xp_success(app, user):
    success, awarded, level_up_info = GamificationService.award_xp(
        user.id, "test_event", "test:1", 50, "Test Reward"
    )
    
    assert success is True
    assert awarded == 50
    assert level_up_info is None
    
    # Check DB
    u = User.query.get(user.id)
    assert u.total_xp == 50
    assert u.level == 1
    
    events = GamificationEvent.query.filter_by(user_id=user.id).all()
    assert len(events) == 1
    assert events[0].source_id == "test:1"

def test_award_xp_duplicate_prevention(app, user):
    # First award
    GamificationService.award_xp(user.id, "test_event", "test:2", 50, "Test Reward")
    
    # Duplicate award with same source_id
    success, awarded, level_up_info = GamificationService.award_xp(
        user.id, "test_event", "test:2", 50, "Test Reward Duplicate"
    )
    
    assert success is False
    assert awarded == 0
    
    u = User.query.get(user.id)
    assert u.total_xp == 50  # Did not increase

def test_award_xp_level_up(app, user):
    success, awarded, level_up_info = GamificationService.award_xp(
        user.id, "test_event", "test:3", 150, "Test Reward"
    )
    
    assert success is True
    assert level_up_info is not None
    assert level_up_info["old_level"] == 1
    assert level_up_info["new_level"] == 2
    
    u = User.query.get(user.id)
    assert u.total_xp == 150
    assert u.level == 2
    
    # Verify Notification created
    notifs = Notification.query.filter_by(user_id=user.id).all()
    assert len(notifs) == 1
    assert notifs[0].type == "level_up"
