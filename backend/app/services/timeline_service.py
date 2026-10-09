from sqlalchemy.orm import joinedload
from app.extensions import db
from app.models import Achievement, Goal, DailyCheckin, Habit, Skill, LifeScore

class TimelineService:
    @staticmethod
    def get_user_timeline(user_id, page=1, per_page=50):
        events = []

        # 1. Achievements
        achievements = Achievement.query.filter_by(user_id=user_id).filter(Achievement.unlocked_at != None).all()
        for a in achievements:
            events.append({
                "id": f"ach_{a.id}",
                "type": "achievement",
                "title": f"Achievement Unlocked: {a.name}",
                "description": a.description,
                "timestamp": a.unlocked_at.isoformat(),
                "icon": a.icon or "🏆",
                "entity_id": a.id
            })

        # 2. Goals Created
        goals = Goal.query.filter_by(user_id=user_id).all()
        for g in goals:
            events.append({
                "id": f"goal_{g.id}",
                "type": "goal",
                "title": f"New Goal: {g.title}",
                "description": f"Target: {g.target}",
                "timestamp": g.created_at.isoformat(),
                "icon": "🎯",
                "entity_id": g.id
            })

        # 3. Daily Check-ins (and Journals)
        checkins = DailyCheckin.query.options(joinedload(DailyCheckin.journal)).filter_by(
            user_id=user_id, is_completed=True
        ).all()
        for c in checkins:
            events.append({
                "id": f"chk_{c.id}",
                "type": "checkin",
                "title": "Daily Check-in Completed",
                "description": f"Rating: {c.daily_rating}/5",
                "timestamp": c.created_at.isoformat(),
                "icon": "✅",
                "entity_id": c.id
            })
            if c.journal and (c.journal.title or c.journal.content):
                events.append({
                    "id": f"jou_{c.journal.id}",
                    "type": "journal",
                    "title": "Journal Entry",
                    "description": c.journal.title or (c.journal.content[:50] + "..." if len(c.journal.content) > 50 else c.journal.content),
                    "timestamp": c.created_at.isoformat(),
                    "icon": "📖",
                    "entity_id": c.journal.id
                })

        # 4. Habits Created
        habits = Habit.query.filter_by(user_id=user_id).all()
        for h in habits:
            events.append({
                "id": f"hab_{h.id}",
                "type": "habit",
                "title": f"Started Habit: {h.name}",
                "description": f"Frequency: {h.frequency}",
                "timestamp": h.created_at.isoformat(),
                "icon": h.icon or "✨",
                "entity_id": h.id
            })

        # 5. Skills Created
        skills = Skill.query.filter_by(user_id=user_id).all()
        for s in skills:
            events.append({
                "id": f"skl_{s.id}",
                "type": "skill",
                "title": f"Started Learning: {s.name}",
                "description": f"Category: {s.category}",
                "timestamp": s.created_at.isoformat(),
                "icon": "🧠",
                "entity_id": s.id
            })

        # 6. Life Score Updates
        life_scores = LifeScore.query.filter_by(user_id=user_id).all()
        for ls in life_scores:
            events.append({
                "id": f"ls_{ls.id}",
                "type": "life_score",
                "title": "Life Score Updated",
                "description": f"Score: {ls.score}",
                "timestamp": ls.created_at.isoformat(),
                "icon": "⭐",
                "entity_id": ls.id
            })

        # Sort by timestamp descending
        events.sort(key=lambda x: x["timestamp"], reverse=True)

        # Pagination
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        paginated = events[start_idx:end_idx]

        return {
            "items": paginated,
            "total": len(events),
            "page": page,
            "per_page": per_page,
            "total_pages": (len(events) + per_page - 1) // per_page
        }, 200
