from datetime import date, timedelta
from app.extensions import db
from app.models import (
    User, DailyCheckin, Activities, MoodLog, Wellbeing,
    JournalEntry, HabitLog, Goal, Achievement, LifeScore, DocumentMemory
)

class AIContextService:
    
    @staticmethod
    def _get_date_cutoff(days):
        return date.today() - timedelta(days=days)

    @staticmethod
    def build_user_context(user_id, days=30):
        user_id = int(user_id)
        user = db.session.get(User, user_id)
        if not user:
            raise ValueError("User not found")
            
        end_date = date.today()
        start_date = AIContextService._get_date_cutoff(days)

        # 1. Base Structure
        context = {
            "user": {
                "id": user.id,
                "level": user.level,
                "total_xp": user.total_xp,
                "current_streak": user.current_streak,
                "longest_streak": user.longest_streak
            },
            "period": {
                "days": days,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "life_score": {"average": 0, "highest": 0, "lowest": 0, "history": []},
            "mood": {"average": 0, "history": [], "distribution": {}},
            "sleep": {"average_hours": 0, "history": []},
            "productivity": {
                "study_hours": 0,
                "work_hours": 0,
                "screen_time_minutes": 0
            },
            "water": {"average_intake_ml": 0, "history": []},
            "habits": {"completion_rate": 0, "history": []},
            "goals": {"completed": 0, "pending": 0, "items": []},
            "achievements": {"unlocked": 0, "recent": []},
            "journal": {"entries": []},
            "document_memories": []
        }

        # 2. Daily Checkins & Relationships
        checkins = db.session.query(DailyCheckin).options(
            db.joinedload(DailyCheckin.activities),
            db.joinedload(DailyCheckin.mood),
            db.joinedload(DailyCheckin.journal)
        ).filter(
            DailyCheckin.user_id == user_id,
            DailyCheckin.date >= start_date,
            DailyCheckin.is_completed == True
        ).order_by(DailyCheckin.date.asc()).all()

        total_sleep = 0
        total_water = 0
        total_mood = 0
        mood_counts = {"1-2": 0, "3-4": 0, "5-6": 0, "7-8": 0, "9-10": 0}
        
        sleep_days = 0
        water_days = 0
        mood_days = 0

        for c in checkins:
            d_str = c.date.isoformat()
            
            # Activities
            if c.activities:
                act = c.activities
                context["productivity"]["study_hours"] += (act.study_hours or 0)
                context["productivity"]["work_hours"] += (act.work_hours or 0)
                context["productivity"]["screen_time_minutes"] += (act.screen_time_minutes or 0)
                
                if act.sleep_hours:
                    total_sleep += act.sleep_hours
                    sleep_days += 1
                    context["sleep"]["history"].append({"date": d_str, "hours": act.sleep_hours})
                    
                if act.water_intake_ml:
                    total_water += act.water_intake_ml
                    water_days += 1
                    context["water"]["history"].append({"date": d_str, "ml": act.water_intake_ml})

            # Mood
            if c.mood:
                m = c.mood
                total_mood += m.mood_score
                mood_days += 1
                context["mood"]["history"].append({
                    "date": d_str,
                    "score": m.mood_score,
                    "intensity": m.intensity,
                    "note": m.note
                })
                
                # Bucket for distribution
                if m.mood_score <= 2: mood_counts["1-2"] += 1
                elif m.mood_score <= 4: mood_counts["3-4"] += 1
                elif m.mood_score <= 6: mood_counts["5-6"] += 1
                elif m.mood_score <= 8: mood_counts["7-8"] += 1
                else: mood_counts["9-10"] += 1

            # Journal
            if c.journal and (c.journal.title or c.journal.content):
                j = c.journal
                entry_data = {"date": d_str}
                if j.title: entry_data["title"] = j.title
                if j.content: entry_data["content"] = j.content
                if c.mood: entry_data["mood_score"] = c.mood.mood_score
                context["journal"]["entries"].append(entry_data)

        # Averages
        if sleep_days > 0:
            context["sleep"]["average_hours"] = round(total_sleep / sleep_days, 1)
        if water_days > 0:
            context["water"]["average_intake_ml"] = round(total_water / water_days)
        if mood_days > 0:
            context["mood"]["average"] = round(total_mood / mood_days, 1)
        context["mood"]["distribution"] = mood_counts

        # 3. Life Scores
        scores = LifeScore.query.filter(
            LifeScore.user_id == user_id,
            LifeScore.date >= start_date
        ).order_by(LifeScore.date.asc()).all()
        
        if scores:
            total_score = 0
            mx = 0
            mn = 100
            for s in scores:
                total_score += s.score
                if s.score > mx: mx = s.score
                if s.score < mn: mn = s.score
                context["life_score"]["history"].append({
                    "date": s.date.isoformat(),
                    "score": s.score
                })
            context["life_score"]["average"] = round(total_score / len(scores))
            context["life_score"]["highest"] = mx
            context["life_score"]["lowest"] = mn

        # 4. Habits
        habit_logs = HabitLog.query.join(DailyCheckin).filter(
            HabitLog.user_id == user_id,
            DailyCheckin.date >= start_date,
            DailyCheckin.is_completed == True
        ).all()
        
        if habit_logs:
            completed_habits = sum(1 for h in habit_logs if h.completed)
            context["habits"]["completion_rate"] = round((completed_habits / len(habit_logs)) * 100)
            
            # Group habits by day to show historical pattern
            habit_history = {}
            for h in habit_logs:
                d_str = h.checkin.date.isoformat()
                if d_str not in habit_history:
                    habit_history[d_str] = []
                habit_history[d_str].append({
                    "name": h.name,
                    "completed": h.completed
                })
            
            # Sort history chronologically
            sorted_dates = sorted(habit_history.keys())
            context["habits"]["history"] = [{"date": d, "habits": habit_history[d]} for d in sorted_dates]

        # 5. Goals
        goals = Goal.query.filter_by(user_id=user_id).all()
        for g in goals:
            if g.progress >= g.target:
                context["goals"]["completed"] += 1
            else:
                context["goals"]["pending"] += 1
            context["goals"]["items"].append({
                "title": g.title,
                "progress": g.progress,
                "target": g.target,
                "category": g.category,
                "created_at": g.created_at.isoformat() if g.created_at else None
            })

        # 6. Achievements
        achievements = Achievement.query.filter_by(user_id=user_id).order_by(Achievement.unlocked_at.desc()).all()
        context["achievements"]["unlocked"] = len(achievements)
        for a in achievements[:5]: # Include up to 5 recent achievements
            context["achievements"]["recent"].append({
                "name": a.name,
                "description": a.description,
                "unlocked_at": a.unlocked_at.isoformat() if a.unlocked_at else None
            })

        # 7. Document Memories
        documents = DocumentMemory.query.filter(
            DocumentMemory.user_id == user_id,
            DocumentMemory.status == 'processed',
            DocumentMemory.created_at >= start_date
        ).order_by(DocumentMemory.created_at.desc()).all()
        for doc in documents:
            context["document_memories"].append({
                "title": doc.title,
                "summary": doc.summary,
                "key_topics": doc.key_topics,
                "created_at": doc.created_at.isoformat()
            })

        return context
