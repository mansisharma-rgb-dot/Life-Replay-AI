import json
import pytest
from datetime import date, timedelta
from app import create_app
from app.extensions import db
from app.models import User, DailyCheckin, Activities, MoodLog, LifeScore, HabitLog, Goal
from app.services.recommendation_service import RecommendationService

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


def test_insufficient_data_handling(app):
    # 14. Insufficient-data behavior, 15. Empty-user behavior
    u = User(full_name='Empty', email='empty@test.com', password_hash='hash')
    db.session.add(u)
    db.session.commit()
    
    res = RecommendationService.generate(u.id, 30)
    
    assert len(res["recommendations"]) == 1
    rec = res["recommendations"][0]
    assert rec["title"] == "Log More Data"
    assert rec["category"] == "general"
    assert rec["evidence"]["trend"] == "insufficient_data"
    
    # 17. JSON serialization
    assert isinstance(json.dumps(res), str)


def test_sleep_and_water_recommendations(app):
    # 1. Strong weakness produces recommendation
    # 4. Sleep recommendation
    # 5. Water recommendation
    # 10. Priority assignment
    # 11. Evidence correctness
    # 12. No fabricated numerical evidence
    
    u = User(full_name='SleepWater', email='sw@test.com', password_hash='hash')
    db.session.add(u)
    db.session.commit()
    
    # Create 5 days of poor sleep (3hrs) and poor water (1000ml)
    today = date.today()
    for i in range(5):
        c = DailyCheckin(user_id=u.id, date=today - timedelta(days=i), is_completed=True)
        db.session.add(c)
        db.session.commit()
        
        # 3 hours sleep (trigger weakness -> high priority sleep rec)
        # 1000ml water (trigger water rec -> medium priority)
        db.session.add(Activities(daily_checkin_id=c.id, sleep_hours=3, water_intake_ml=1000))
        
        # Add high mood to prevent mood recommendation
        db.session.add(MoodLog(daily_checkin_id=c.id, mood_score=9, intensity=3))
        
        # Add high life score to prevent life score weakness
        db.session.add(LifeScore(user_id=u.id, date=today - timedelta(days=i), score=90))
        
    db.session.commit()
    
    res = RecommendationService.generate(u.id, 30)
    recs = res["recommendations"]
    
    sleep_rec = next((r for r in recs if r["category"] == "sleep"), None)
    water_rec = next((r for r in recs if r["category"] == "water"), None)
    
    assert sleep_rec is not None
    assert sleep_rec["priority"] == "high"
    assert sleep_rec["evidence"]["value"] == 3.0  # Exactly matches the db data
    assert sleep_rec["evidence"]["target"] == 8.0
    
    assert water_rec is not None
    assert water_rec["priority"] == "medium"
    assert water_rec["evidence"]["value"] == 1000
    assert water_rec["evidence"]["target"] == 2000
    
    # Check that high priority comes before medium
    assert recs.index(sleep_rec) < recs.index(water_rec)


def test_productivity_and_goals_recommendations(app):
    # 6. Productivity recommendation
    # 8. Goal recommendation
    
    u = User(full_name='Prod', email='p@test.com', password_hash='hash')
    db.session.add(u)
    db.session.commit()
    
    # Add a pending goal to trigger goal recommendation
    g = Goal(user_id=u.id, title="Learn Python", target=100, progress=0, category="Learning")
    db.session.add(g)
    db.session.commit()
    
    # Create 5 days of 0 productivity
    today = date.today()
    for i in range(5):
        c = DailyCheckin(user_id=u.id, date=today - timedelta(days=i), is_completed=True)
        db.session.add(c)
        db.session.commit()
        db.session.add(Activities(daily_checkin_id=c.id, study_hours=0, work_hours=0, sleep_hours=8, water_intake_ml=2500))
        db.session.add(MoodLog(daily_checkin_id=c.id, mood_score=8, intensity=3))
        db.session.add(LifeScore(user_id=u.id, date=today - timedelta(days=i), score=80))
        
    db.session.commit()
    
    res = RecommendationService.generate(u.id, 30)
    recs = res["recommendations"]
    
    prod_rec = next((r for r in recs if r["category"] == "productivity"), None)
    goal_rec = next((r for r in recs if r["category"] == "goals"), None)
    
    assert prod_rec is not None
    assert prod_rec["evidence"]["value"] == 0
    assert prod_rec["priority"] == "medium"
    
    assert goal_rec is not None
    assert goal_rec["evidence"]["target"] == 1
    assert goal_rec["priority"] == "medium"


def test_trends_and_maintenance(app):
    # 2. Declining trend produces recommendation
    # 3. Strong metric produces maintenance recommendation when appropriate
    # 18. Deterministic output
    
    u = User(full_name='Trend', email='t@test.com', password_hash='hash')
    db.session.add(u)
    db.session.commit()
    
    # 6 days to establish trend
    # Mood starts at 9, drops to 6 (declining)
    # Sleep is constantly 9 (strength)
    today = date.today()
    for i in range(6):
        c = DailyCheckin(user_id=u.id, date=today - timedelta(days=5 - i), is_completed=True)
        db.session.add(c)
        db.session.commit()
        
        mood_val = 9 if i < 3 else 6
        db.session.add(Activities(daily_checkin_id=c.id, sleep_hours=9, water_intake_ml=2500))
        db.session.add(MoodLog(daily_checkin_id=c.id, mood_score=mood_val, intensity=3))
        db.session.add(LifeScore(user_id=u.id, date=today - timedelta(days=5 - i), score=80))
        
    db.session.commit()
    
    res1 = RecommendationService.generate(u.id, 30)
    res2 = RecommendationService.generate(u.id, 30)
    assert res1 == res2 # 18. Deterministic
    
    recs = res1["recommendations"]
    
    # We should have a declining mood rec
    mood_trend_rec = next((r for r in recs if r["category"] == "mood"), None)
    assert mood_trend_rec is not None
    assert mood_trend_rec["priority"] == "high" # Trends are high priority
    assert mood_trend_rec["evidence"]["trend"] == "declining"
    assert "declining" in mood_trend_rec["reason"]
    
    # We should have a sleep maintenance rec
    sleep_maint_rec = next((r for r in recs if r["category"] == "sleep"), None)
    assert sleep_maint_rec is not None
    assert sleep_maint_rec["priority"] == "low" # Maintenance is low priority
    assert sleep_maint_rec["evidence"]["trend"] == "stable"
    assert "Maintain" in sleep_maint_rec["title"]


def test_max_recommendations_and_isolation(app):
    # 9. Maximum 5 recommendations
    # 16. User isolation
    u1 = User(full_name='U1', email='u1@test.com', password_hash='hash')
    u2 = User(full_name='U2', email='u2@test.com', password_hash='hash')
    db.session.add_all([u1, u2])
    db.session.commit()
    
    # Make U1 have EVERYTHING bad to trigger many recommendations
    today = date.today()
    for i in range(6):
        c = DailyCheckin(user_id=u1.id, date=today - timedelta(days=i), is_completed=True)
        db.session.add(c)
        db.session.commit()
        db.session.add(Activities(daily_checkin_id=c.id, sleep_hours=2, water_intake_ml=500, study_hours=0, work_hours=0))
        db.session.add(MoodLog(daily_checkin_id=c.id, mood_score=2, intensity=3))
        db.session.add(LifeScore(user_id=u1.id, date=today - timedelta(days=i), score=20))
    
    g = Goal(user_id=u1.id, title="Test", target=10, progress=0, category="Test")
    db.session.add(g)
    db.session.commit()
    
    res1 = RecommendationService.generate(u1.id, 30)
    assert len(res1["recommendations"]) == 5 # Capped at 5
    
    res2 = RecommendationService.generate(u2.id, 30)
    assert len(res2["recommendations"]) == 1 # Just insufficient data for U2
    
def test_time_ranges(app):
    # 19, 20, 21, 22. Date Ranges
    u = User(full_name='Time', email='time@test.com', password_hash='hash')
    db.session.add(u)
    db.session.commit()
    
    # Just run it through all ranges to verify no crashes and accurate propagation
    r7 = RecommendationService.generate(u.id, 7)
    r30 = RecommendationService.generate(u.id, 30)
    r90 = RecommendationService.generate(u.id, 90)
    r365 = RecommendationService.generate(u.id, 365)
    
    assert r7["period"]["days"] == 7
    assert r30["period"]["days"] == 30
    assert r90["period"]["days"] == 90
    assert r365["period"]["days"] == 365
