import pytest
from datetime import date, timedelta
from app.services.time_analysis_service import TimeAnalysisService
from app.models import DailyCheckin, Activities, Wellbeing, HabitLog, Goal
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

def test_time_analysis_empty_dataset(app):
    u = User(full_name='Empty', email='empty@test.com', password_hash='hash')
    db.session.add(u)
    db.session.commit()
    result = TimeAnalysisService.analyze(u.id, 30)
    assert result["summary"]["averageProductivityScore"] == 0
    assert result["summary"]["productiveHoursTotal"] == 0
    assert len(result["daily"]) == 0

def test_time_analysis_normal_dataset(app):
    u = User(full_name='Normal', email='normal@test.com', password_hash='hash')
    db.session.add(u)
    db.session.commit()
    
    # Add checkins
    c1 = DailyCheckin(user_id=u.id, date=date.today(), is_completed=True)
    db.session.add(c1)
    db.session.commit()
    
    a1 = Activities(
        daily_checkin_id=c1.id, 
        study_hours=2.0, 
        work_hours=2.0, 
        leisure_hours=1.0, 
        screen_time_minutes=60, # 1 hr
        exercise_minutes=60 # 1 hr
    )
    w1 = Wellbeing(daily_checkin_id=c1.id, focus_level=4, energy_level=4)
    
    db.session.add(a1)
    db.session.add(w1)
    db.session.commit()
    
    result = TimeAnalysisService.analyze(u.id, 30)
    
    assert len(result["daily"]) == 1
    
    daily = result["daily"][0]
    # Productive: 2 + 2 + 1 = 5
    # Unproductive: 1 + 1 = 2
    assert daily["productiveHours"] == 5.0
    assert daily["unproductiveHours"] == 2.0
    assert daily["focus"] == 4
    
    # Check score math
    assert result["summary"]["averageProductivityScore"] > 0
    assert result["summary"]["productiveHoursTotal"] == 5.0

def test_time_analysis_isolation(app):
    u1 = User(full_name='User1', email='u1@test.com', password_hash='hash')
    other_user = User(full_name='User2', email='u2@test.com', password_hash='hash')
    db.session.add_all([u1, other_user])
    db.session.commit()
    
    c = DailyCheckin(user_id=other_user.id, date=date.today(), is_completed=True)
    db.session.add(c)
    db.session.commit()
    
    a = Activities(daily_checkin_id=c.id, study_hours=10.0)
    db.session.add(a)
    db.session.commit()
    
    # Query for sample_user, should be empty
    result = TimeAnalysisService.analyze(u1.id, 30)
    assert result["summary"]["productiveHoursTotal"] == 0

def test_score_penalty(app):
    u = User(full_name='Penalty', email='penalty@test.com', password_hash='hash')
    db.session.add(u)
    db.session.commit()
    
    c1 = DailyCheckin(user_id=u.id, date=date.today(), is_completed=True)
    db.session.add(c1)
    db.session.commit()
    
    # High unproductivity
    a1 = Activities(
        daily_checkin_id=c1.id, 
        study_hours=0.0, 
        leisure_hours=8.0, 
        screen_time_minutes=120
    )
    db.session.add(a1)
    db.session.commit()
    
    result = TimeAnalysisService.analyze(u.id, 30)
    daily = result["daily"][0]
    
    # Unproductive = 8 + 2 = 10
    # Penalty: (10 - 2) * -5 = -40, clamped to max penalty -20
    # So score should be 0 because productive is 0
    assert daily["score"] == 0
