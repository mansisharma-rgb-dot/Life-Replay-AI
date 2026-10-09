import pytest
from datetime import date, timedelta
from app.services.future_goal_service import FutureGoalService
from app.models import DailyCheckin, Activities, Wellbeing, HabitLog, Goal, Habit
from app.extensions import db
from app import create_app
from app.models import User

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

def test_future_goal_insufficient_data(app):
    u = User(full_name='Empty', email='empty@test.com', password_hash='hash')
    db.session.add(u)
    db.session.commit()
    
    # User has 0 days active
    result = FutureGoalService.generate_predictions(u.id, 30)
    assert result["data_sufficiency"] is False
    assert len(result["predictions"]) == 0
    assert "Not enough history" in result["message"]

def test_future_goal_sufficient_data_rule_based(app):
    u = User(full_name='Normal', email='normal@test.com', password_hash='hash')
    db.session.add(u)
    db.session.commit()
    
    # Need at least 5 checkins
    checkins = []
    for i in range(5):
        c = DailyCheckin(user_id=u.id, date=date.today() - timedelta(days=i), is_completed=True)
        db.session.add(c)
        db.session.commit()
        db.session.add(Activities(daily_checkin_id=c.id, study_hours=3.0))
        db.session.add(Wellbeing(daily_checkin_id=c.id, focus_level=5, energy_level=4))
        db.session.commit()
        checkins.append(c)
        
    # High habit consistency (1 habit, 5 completions)
    h = Habit(user_id=u.id, name='Read', frequency='daily')
    db.session.add(h)
    db.session.commit()
    for c in checkins:
        db.session.add(HabitLog(user_id=u.id, habit_id=h.id, name=h.name, daily_checkin_id=c.id, completed=True))
    db.session.commit()
    
    # The LLM fallback will trigger because OPENAI_API_KEY is not set or mocked
    # We should get rule-based predictions
    result = FutureGoalService.generate_predictions(u.id, 30)
    
    assert result["data_sufficiency"] is True
    assert len(result["predictions"]) > 0
    assert result["metrics"]["days_active"] == 5
    assert result["metrics"]["habit_consistency"] == 100
    
    titles = [p["title"] for p in result["predictions"]]
    assert "Maintain High Habit Consistency" in titles

def test_future_goal_user_isolation(app):
    u1 = User(full_name='User1', email='u1@test.com', password_hash='hash')
    u2 = User(full_name='User2', email='u2@test.com', password_hash='hash')
    db.session.add_all([u1, u2])
    db.session.commit()
    
    # u2 has data
    for i in range(5):
        c = DailyCheckin(user_id=u2.id, date=date.today() - timedelta(days=i), is_completed=True)
        db.session.add(c)
        db.session.commit()
    
    # u1 has none
    result = FutureGoalService.generate_predictions(u1.id, 30)
    assert result["data_sufficiency"] is False
    assert result["metrics"]["days_active"] == 0
