import pytest
from datetime import date, datetime, timezone
from app import create_app
from app.extensions import db
from app.models import User, DailyCheckin, Goal, Habit, HabitLog, JournalEntry, DocumentMemory, Skill, Achievement, Wellbeing, Activities, MoodLog
from app.services.life_memory_retrieval_service import LifeMemoryRetrievalService

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def extraction_user(app):
    user = User(full_name="extractor_test", email="extract@test.com", password_hash="hash")
    db.session.add(user)
    db.session.commit()
    return user

@pytest.fixture
def extraction_user2(app):
    user = User(full_name="extractor_test2", email="extract2@test.com", password_hash="hash")
    db.session.add(user)
    db.session.commit()
    return user

def test_goal_extraction(app, extraction_user):
    goal = Goal(user_id=extraction_user.id, title="Learn Guitar", progress=50.0, target=100.0, category="Music", status="active", deadline=date(2026, 12, 31))
    db.session.add(goal)
    db.session.commit()

    
    ctx = LifeMemoryRetrievalService.retrieve_context(extraction_user.id, ["Guitar"])
    assert len(ctx["goals"]) == 1
    g = ctx["goals"][0]
    assert "Learn Guitar" in g["content"]
    assert "50.0/100.0" in g["content"]
    assert "Music" in g["content"]
    assert "active" in g["content"]

def test_habit_extraction(app, extraction_user):
    habit = Habit(user_id=extraction_user.id, name="Read Books", frequency="daily", status="active", current_streak=10, longest_streak=20)
    db.session.add(habit)
    db.session.commit()

    ctx = LifeMemoryRetrievalService.retrieve_context(extraction_user.id, ["Read"])
    assert len(ctx["habits"]) == 1
    h = ctx["habits"][0]
    assert "Read Books" in h["content"]
    assert "daily" in h["content"]
    assert "10" in h["content"]
    assert "20" in h["content"]

def test_checkin_activities_extraction(app, extraction_user):
    checkin = DailyCheckin(user_id=extraction_user.id, date=date(2026, 8, 20), daily_rating=4)
    db.session.add(checkin)
    db.session.commit()
    
    act = Activities(daily_checkin_id=checkin.id, study_hours=5.5, sleep_hours=7.0, water_intake_ml=2500, walking_steps=10000, meditation_minutes=15)
    db.session.add(act)
    db.session.commit()

    ctx = LifeMemoryRetrievalService.retrieve_context(extraction_user.id, [], start_date=date(2026, 8, 20), end_date=date(2026, 8, 20))
    t = ctx["timeline"][0]
    assert "Study: 5.5h" in t["content"]
    assert "Sleep: 7.0h" in t["content"]
    assert "Water: 2500ml" in t["content"]
    assert "Steps: 10000" in t["content"]
    assert "Meditation: 15m" in t["content"]

def test_checkin_wellbeing_mood_extraction(app, extraction_user):
    checkin = DailyCheckin(user_id=extraction_user.id, date=date(2026, 8, 21), daily_rating=5)
    db.session.add(checkin)
    db.session.commit()

    wb = Wellbeing(daily_checkin_id=checkin.id, energy_level=4, stress_level=2, focus_level=5, motivation_level=4)
    mood = MoodLog(daily_checkin_id=checkin.id, mood_score=5)
    db.session.add(wb)
    db.session.add(mood)
    db.session.commit()

    ctx = LifeMemoryRetrievalService.retrieve_context(extraction_user.id, [], start_date=date(2026, 8, 21), end_date=date(2026, 8, 21))
    t = ctx["timeline"][0]
    assert "Mood Score: 5/5" in t["content"]
    assert "Energy: 4/5" in t["content"]
    assert "Stress: 2/5" in t["content"]
    assert "Focus: 5/5" in t["content"]

def test_journal_and_checkin_reflection(app, extraction_user):
    checkin = DailyCheckin(user_id=extraction_user.id, date=date(2026, 8, 22), daily_rating=3)
    db.session.add(checkin)
    db.session.commit()

    journal = JournalEntry(daily_checkin_id=checkin.id, title="Deep Thoughts", content="I feel great today.")
    db.session.add(journal)
    db.session.commit()

    ctx = LifeMemoryRetrievalService.retrieve_context(extraction_user.id, ["Deep"])
    
    j = ctx["journals"][0]
    assert "Deep Thoughts" in j["content"]
    assert "I feel great today" in j["content"]
    
    t = next(x for x in ctx["timeline"] if x["id"] == checkin.id)
    assert "Reflection: I feel great today." in t["content"]

def test_checkin_habits_completed(app, extraction_user):
    checkin = DailyCheckin(user_id=extraction_user.id, date=date(2026, 8, 23))
    db.session.add(checkin)
    db.session.commit()

    hl = HabitLog(user_id=extraction_user.id, daily_checkin_id=checkin.id, name="Meditation", completed=True)
    db.session.add(hl)
    db.session.commit()

    ctx = LifeMemoryRetrievalService.retrieve_context(extraction_user.id, [], start_date=date(2026, 8, 23), end_date=date(2026, 8, 23))
    t = ctx["timeline"][0]
    assert "Completed Habits: Meditation" in t["content"]

def test_skill_extraction(app, extraction_user):
    skill = Skill(user_id=extraction_user.id, name="Python", category="Tech", level=3, progress=15.0)
    db.session.add(skill)
    db.session.commit()

    ctx = LifeMemoryRetrievalService.retrieve_context(extraction_user.id, ["Python"])
    s = ctx["skills"][0]
    assert "Python" in s["content"]
    assert "Tech" in s["content"]
    assert "Level: 3" in s["content"]

def test_achievement_extraction(app, extraction_user):
    ach = Achievement(user_id=extraction_user.id, name="First Week", description="Logged in for a week")
    db.session.add(ach)
    db.session.commit()

    ctx = LifeMemoryRetrievalService.retrieve_context(extraction_user.id, ["First"])
    a = ctx["achievements"][0]
    assert "First Week" in a["content"]
    assert "Logged in for a week" in a["content"]

def test_document_extraction(app, extraction_user):
    doc = DocumentMemory(user_id=extraction_user.id, filename="test.pdf", original_name="test.pdf", file_type="application/pdf", file_size=1024, title="Resume", summary="My CV", key_topics="jobs", extracted_text="Lots of experience", status="processed")
    db.session.add(doc)
    db.session.commit()

    ctx = LifeMemoryRetrievalService.retrieve_context(extraction_user.id, ["Resume"])
    d = ctx["documents"][0]
    assert "Resume" in d["content"]
    assert "My CV" in d["content"]
    assert "Lots of experience" in d["content"]

def test_intent_prioritization_goal_related_checkin(app, extraction_user):
    c1 = DailyCheckin(user_id=extraction_user.id, date=date(2026, 8, 1))
    c2 = DailyCheckin(user_id=extraction_user.id, date=date(2026, 8, 2))
    db.session.add_all([c1, c2])
    db.session.commit()

    hl = HabitLog(user_id=extraction_user.id, daily_checkin_id=c1.id, name="Guitar Practice", completed=True)
    db.session.add(hl)
    db.session.commit()

    # Search for "Guitar", it should retrieve c1 even if there are many checkins
    ctx = LifeMemoryRetrievalService.retrieve_context(extraction_user.id, ["Guitar"], intent="GOAL")
    assert ctx["timeline"][0]["id"] == c1.id

def test_empty_fallback(app, extraction_user):
    ctx = LifeMemoryRetrievalService.retrieve_context(extraction_user.id, ["NonExistentKeyword"])
    for key in ctx:
        assert len(ctx[key]) == 0

def test_user_isolation_checkins(app, extraction_user, extraction_user2):
    c1 = DailyCheckin(user_id=extraction_user2.id, date=date(2026, 8, 1))
    db.session.add(c1)
    db.session.commit()
    
    ctx = LifeMemoryRetrievalService.retrieve_context(extraction_user.id, [])
    assert len(ctx["timeline"]) == 0

def test_user_isolation_goals(app, extraction_user, extraction_user2):
    g1 = Goal(user_id=extraction_user2.id, title="Test", progress=0, target=1)
    db.session.add(g1)
    db.session.commit()
    
    ctx = LifeMemoryRetrievalService.retrieve_context(extraction_user.id, [])
    assert len(ctx["goals"]) == 0

def test_user_isolation_journals(app, extraction_user, extraction_user2):
    c1 = DailyCheckin(user_id=extraction_user2.id, date=date(2026, 8, 1))
    db.session.add(c1)
    db.session.commit()
    j1 = JournalEntry(daily_checkin_id=c1.id, title="Test", content="Data")
    db.session.add(j1)
    db.session.commit()
    
    ctx = LifeMemoryRetrievalService.retrieve_context(extraction_user.id, [])
    assert len(ctx["journals"]) == 0
