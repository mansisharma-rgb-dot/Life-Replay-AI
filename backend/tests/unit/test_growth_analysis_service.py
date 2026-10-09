import json
import pytest
from datetime import date, timedelta
from app import create_app
from app.extensions import db
from app.models import User, DailyCheckin, Activities, MoodLog, LifeScore, HabitLog
from app.services.growth_analysis_service import GrowthAnalysisService

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

def test_empty_user_analysis(app):
    # 1. Empty user / 8. Insufficient trend data
    u = User(full_name='Empty User', email='empty@test.com', password_hash='hash')
    db.session.add(u)
    db.session.commit()
    
    analysis = GrowthAnalysisService.analyze(u.id, 30)
    assert analysis["summary"]["overall_score"] is None
    assert analysis["summary"]["strongest_area"] is None
    assert analysis["summary"]["weakest_area"] is None
    assert analysis["summary"]["trend"] == "insufficient_data"
    assert len(analysis["strengths"]) == 0
    assert len(analysis["weaknesses"]) == 0
    assert len(analysis["trends"]) == 0
    assert len(analysis["correlations"]) == 0

def test_deterministic_analysis_and_trends(app):
    # 2. Known dataset, 3,4. Strongest/Weakest, 5,6,7. Trends, 9. Correlation, 11. JSON, 12. Determinism
    u = User(full_name='Known', email='known@test.com', password_hash='hash')
    db.session.add(u)
    db.session.commit()
    
    today = date.today()
    # Create 6 days of data to establish trends
    # Sleep improves: 4, 4, 5 -> 8, 9, 9
    # Mood improves: 3, 3, 4 -> 8, 9, 9
    # (High correlation positive)
    for i in range(6):
        d = today - timedelta(days=5 - i)
        c = DailyCheckin(user_id=u.id, date=d, is_completed=True)
        db.session.add(c)
        db.session.commit()
        
        sleep_val = 4 if i < 3 else 9
        mood_val = 3 if i < 3 else 9
        
        db.session.add(Activities(daily_checkin_id=c.id, sleep_hours=sleep_val))
        db.session.add(MoodLog(daily_checkin_id=c.id, mood_score=mood_val, intensity=3))
        
        ls_val = 40 if i < 3 else 95 # Life score improves too
        db.session.add(LifeScore(user_id=u.id, date=d, score=ls_val))
    db.session.commit()

    analysis1 = GrowthAnalysisService.analyze(u.id, 7)
    analysis2 = GrowthAnalysisService.analyze(u.id, 7)
    
    # 12. Determinism
    assert analysis1 == analysis2
    
    # 11. Serialization
    json_str = json.dumps(analysis1)
    assert "overall_score" in json_str
    
    # 5. Improving trends (Change should be +5 for Sleep, +6 for Mood, etc)
    assert analysis1["summary"]["trend"] == "improving"
    trends = {t["metric"]: t for t in analysis1["trends"]}
    assert trends["Sleep"]["direction"] == "improving"
    assert trends["Mood"]["direction"] == "improving"
    assert trends["Life Score"]["direction"] == "improving"
    
    # 9. Correlation
    assert len(analysis1["correlations"]) > 0
    corr = analysis1["correlations"][0]
    assert corr["metric1"] == "Sleep"
    assert corr["metric2"] == "Mood"
    assert corr["direction"] == "positive"
    
    # Check strongest / weakest
    # Average sleep = 6.5 (normalized ~81%)
    # Average mood = 6.0 (normalized 60%)
    # Average life score = 67.5
    assert analysis1["summary"]["weakest_area"] == "Mood"
    assert analysis1["summary"]["strongest_area"] == "Sleep"

def test_user_isolation_analysis(app):
    # 10. User isolation
    u1 = User(full_name='User 1', email='u1@test.com', password_hash='hash')
    u2 = User(full_name='User 2', email='u2@test.com', password_hash='hash')
    db.session.add_all([u1, u2])
    db.session.commit()
    
    # U1 has great sleep
    c1 = DailyCheckin(user_id=u1.id, date=date.today(), is_completed=True)
    db.session.add(c1)
    db.session.commit()
    db.session.add(Activities(daily_checkin_id=c1.id, sleep_hours=9))
    
    # U2 has poor sleep
    c2 = DailyCheckin(user_id=u2.id, date=date.today(), is_completed=True)
    db.session.add(c2)
    db.session.commit()
    db.session.add(Activities(daily_checkin_id=c2.id, sleep_hours=3))
    db.session.commit()
    
    a1 = GrowthAnalysisService.analyze(u1.id, 7)
    a2 = GrowthAnalysisService.analyze(u2.id, 7)
    
    assert any(s["area"] == "Sleep" and s["value"] == 9 for s in a1["strengths"])
    assert any(w["area"] == "Sleep" and w["value"] == 3 for w in a2["weaknesses"])

def test_date_ranges(app):
    # 13, 14, 15, 16. Date Ranges
    u = User(full_name='DateRanges', email='dates@test.com', password_hash='hash')
    db.session.add(u)
    db.session.commit()
    
    # Put a checkin at today, -20 days, -60 days, -200 days
    offsets = [0, 20, 60, 200]
    for o in offsets:
        c = DailyCheckin(user_id=u.id, date=date.today() - timedelta(days=o), is_completed=True)
        db.session.add(c)
        db.session.commit()
        db.session.add(Activities(daily_checkin_id=c.id, sleep_hours=8))
        db.session.commit()
        
    # Test ranges
    a7 = GrowthAnalysisService.analyze(u.id, 7)
    assert a7["period"]["days"] == 7
    # Since sleep is constant at 8, trend is insufficient_data due to len < 4, but we can verify it doesn't crash
    
    a30 = GrowthAnalysisService.analyze(u.id, 30)
    assert a30["period"]["days"] == 30
    
    a90 = GrowthAnalysisService.analyze(u.id, 90)
    assert a90["period"]["days"] == 90
    
    a365 = GrowthAnalysisService.analyze(u.id, 365)
    assert a365["period"]["days"] == 365
