import json
import pytest
from datetime import date, timedelta
from app import create_app
from app.extensions import db
from app.models import User, DailyCheckin, Activities, MoodLog, LifeScore
from app.services.ai_insight_service import AIInsightService, DummyAIProvider

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

# --- Mocks for Provider Testing ---
class TimeoutProvider:
    @staticmethod
    def generate_insights(analysis_payload):
        raise Exception("Provider timeout")

class MalformedProvider:
    @staticmethod
    def generate_insights(analysis_payload):
        return ["not", "a", "dict"]

class MissingFieldsProvider:
    @staticmethod
    def generate_insights(analysis_payload):
        return {"summary": "missing insights key"}

class BadCategoryProvider:
    @staticmethod
    def generate_insights(analysis_payload):
        return {
            "summary": "Valid summary",
            "insights": [
                {
                    "title": "Good", "category": "fake_category", 
                    "message": "x", "evidence": {}, "priority": "low"
                }
            ]
        }

class LimitExceededProvider:
    @staticmethod
    def generate_insights(analysis_payload):
        return {
            "summary": "Valid",
            "insights": [{"title": "t", "category": "trend", "message": "m", "evidence": {}, "priority": "low"}] * 10
        }

# --- Tests ---

def test_insufficient_data_handling(app):
    # 10. Insufficient-data handling
    u = User(full_name='Empty', email='empty@test.com', password_hash='hash')
    db.session.add(u)
    db.session.commit()
    
    # Use the default Dummy Provider
    AIInsightService.set_provider(DummyAIProvider)
    insights = AIInsightService.generate_personalized_insights(u.id, 30)
    
    # Must intercept and return specific insufficient data message
    assert "More check-ins are needed" in insights["summary"]
    assert len(insights["insights"]) == 0
    # 12. Serialization
    assert isinstance(json.dumps(insights), str)

def test_successful_insight_generation(app):
    # 1. Successful insight generation
    # 2. Structured JSON parsing
    # 9. Evidence validation
    u = User(full_name='Success', email='s@test.com', password_hash='hash')
    db.session.add(u)
    db.session.commit()
    
    # Add enough checkins to trigger actual analysis (>= 4 for trend)
    today = date.today()
    for i in range(5):
        c = DailyCheckin(user_id=u.id, date=today - timedelta(days=i), is_completed=True)
        db.session.add(c)
        db.session.commit()
        db.session.add(Activities(daily_checkin_id=c.id, sleep_hours=8))
    db.session.commit()
    
    AIInsightService.set_provider(DummyAIProvider)
    insights = AIInsightService.generate_personalized_insights(u.id, 30)
    
    assert insights["summary"] != "More check-ins are needed to generate personalized insights."
    assert "generated_at" in insights
    assert isinstance(insights["insights"], list)
    
    if len(insights["insights"]) > 0:
        first = insights["insights"][0]
        assert "evidence" in first
        assert "metric" in first["evidence"]

def test_provider_errors_and_malformed_responses(app):
    # 5. Malformed provider response
    # 6. Provider timeout/error
    # 3. Required field validation
    # 7. Unsupported category rejection
    # 8. Insight count limit
    u = User(full_name='Error', email='e@test.com', password_hash='hash')
    db.session.add(u)
    db.session.commit()
    
    # We need enough data to bypass the early 'insufficient_data' return
    today = date.today()
    for i in range(5):
        c = DailyCheckin(user_id=u.id, date=today - timedelta(days=i), is_completed=True)
        db.session.add(c)
        db.session.commit()
        db.session.add(Activities(daily_checkin_id=c.id, sleep_hours=8))
    db.session.commit()

    # 6. Timeout
    AIInsightService.set_provider(TimeoutProvider)
    res = AIInsightService.generate_personalized_insights(u.id, 30)
    assert res["summary"] == "Your data is available, but personalized insights could not be generated right now."
    assert len(res["insights"]) == 0

    # 5. Malformed (list instead of dict)
    AIInsightService.set_provider(MalformedProvider)
    res = AIInsightService.generate_personalized_insights(u.id, 30)
    assert res["summary"] == "Your data is available, but personalized insights could not be generated right now."

    # 3. Missing fields
    AIInsightService.set_provider(MissingFieldsProvider)
    res = AIInsightService.generate_personalized_insights(u.id, 30)
    assert res["summary"] == "Your data is available, but personalized insights could not be generated right now."
    
    # 7. Unsupported category
    AIInsightService.set_provider(BadCategoryProvider)
    res = AIInsightService.generate_personalized_insights(u.id, 30)
    assert len(res["insights"]) == 0 # falls back
    
    # 8. Insight count limit
    AIInsightService.set_provider(LimitExceededProvider)
    res = AIInsightService.generate_personalized_insights(u.id, 30)
    assert len(res["insights"]) == 0 # falls back

def test_user_isolation(app):
    # 11. User isolation
    u1 = User(full_name='U1', email='u1@test.com', password_hash='hash')
    u2 = User(full_name='U2', email='u2@test.com', password_hash='hash')
    db.session.add_all([u1, u2])
    db.session.commit()
    
    # U1 has data
    today = date.today()
    for i in range(5):
        c = DailyCheckin(user_id=u1.id, date=today - timedelta(days=i), is_completed=True)
        db.session.add(c)
        db.session.commit()
        db.session.add(Activities(daily_checkin_id=c.id, sleep_hours=8))
    db.session.commit()
    
    AIInsightService.set_provider(DummyAIProvider)
    
    res1 = AIInsightService.generate_personalized_insights(u1.id, 30)
    res2 = AIInsightService.generate_personalized_insights(u2.id, 30)
    
    # U1 should have insights, U2 should have insufficient data fallback
    assert "Your data indicates" in res1["summary"]
    assert "More check-ins are needed" in res2["summary"]

def test_time_ranges(app):
    # 13, 14, 15, 16. Time ranges
    u = User(full_name='Time', email='time@test.com', password_hash='hash')
    db.session.add(u)
    db.session.commit()
    
    AIInsightService.set_provider(DummyAIProvider)
    
    res_7 = AIInsightService.generate_personalized_insights(u.id, 7)
    res_30 = AIInsightService.generate_personalized_insights(u.id, 30)
    res_90 = AIInsightService.generate_personalized_insights(u.id, 90)
    res_365 = AIInsightService.generate_personalized_insights(u.id, 365)
    
    assert res_7["summary"] == "More check-ins are needed to generate personalized insights."
    assert res_30["summary"] == "More check-ins are needed to generate personalized insights."
    assert res_90["summary"] == "More check-ins are needed to generate personalized insights."
    assert res_365["summary"] == "More check-ins are needed to generate personalized insights."
