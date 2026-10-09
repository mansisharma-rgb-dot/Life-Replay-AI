from datetime import datetime, date
from typing import List, Dict, Any, Optional
from sqlalchemy import or_, and_, desc
from app.extensions import db
from app.models import (
    User, DocumentMemory, JournalEntry, Goal, 
    Habit, Skill, Achievement, DailyCheckin, HabitLog
)

class LifeMemoryRetrievalService:
    """
    Retrieves highly relevant life data to answer user queries without overflowing context.
    """

    @staticmethod
    def retrieve_context(user_id: int, search_terms: List[str], start_date: Optional[date] = None, end_date: Optional[date] = None, intent: str = "GENERAL_REPLAY") -> Dict[str, Any]:
        """
        Gathers relevant life data based on date ranges, intents, and simple keyword matching.
        """
        context = {
            "documents": [],
            "journals": [],
            "goals": [],
            "habits": [],
            "skills": [],
            "achievements": [],
            "timeline": []
        }

        user = User.query.get(user_id)
        if not user:
            return context

        CATEGORY_WORDS = {"goal", "goals", "habit", "habits", "journal", "journals", "document", "documents", "doc", "docs", "pdf", "pdfs", "skill", "skills", "achievement", "achievements", "award", "awards", "working", "toward", "towards", "doing", "happen", "happened", "tell", "show", "what", "which", "recent", "my"}
        specific_terms = [t for t in search_terms if t.lower() not in CATEGORY_WORDS]

        # 1. Documents
        if user.privacy_analyze_documents:
            doc_query = DocumentMemory.query.filter_by(user_id=user_id, status='processed')
            if start_date:
                doc_query = doc_query.filter(DocumentMemory.created_at >= start_date)
            if end_date:
                doc_query = doc_query.filter(DocumentMemory.created_at <= end_date)
            if specific_terms:
                filters = []
                for term in specific_terms:
                    term_ilike = f"%{term}%"
                    filters.append(
                        or_(
                            DocumentMemory.title.ilike(term_ilike),
                            DocumentMemory.summary.ilike(term_ilike),
                            DocumentMemory.extracted_text.ilike(term_ilike)
                        )
                    )
                doc_query = doc_query.filter(or_(*filters))
            doc_limit = 10 if intent == "DOCUMENT" else 5
            docs = doc_query.order_by(desc(DocumentMemory.created_at)).limit(doc_limit).all()
            if not docs and intent == "DOCUMENT":
                docs = DocumentMemory.query.filter_by(user_id=user_id, status='processed').order_by(desc(DocumentMemory.created_at)).limit(doc_limit).all()
            for d in docs:
                content = f"Title: {d.title}\nSummary: {d.summary}\nTopics: {d.key_topics}\nExtracted Text Excerpt: {d.extracted_text[:300] if d.extracted_text else ''}..."
                context["documents"].append({
                    "type": "document",
                    "id": d.id,
                    "title": d.title,
                    "date": d.created_at.isoformat() if d.created_at else None,
                    "label": f"Document — {d.created_at.strftime('%b %d')}" if d.created_at else "Document",
                    "content": content
                })

        # 2. Journals
        if user.privacy_analyze_journals:
            journal_query = db.session.query(JournalEntry).join(DailyCheckin).filter(DailyCheckin.user_id == user_id)
            if start_date:
                journal_query = journal_query.filter(DailyCheckin.date >= start_date)
            if end_date:
                journal_query = journal_query.filter(DailyCheckin.date <= end_date)
            if specific_terms:
                filters = []
                for term in specific_terms:
                    term_ilike = f"%{term}%"
                    filters.append(
                        or_(
                            JournalEntry.title.ilike(term_ilike),
                            JournalEntry.content.ilike(term_ilike)
                        )
                    )
                journal_query = journal_query.filter(or_(*filters))
            journal_limit = 15 if intent == "JOURNAL" else 10
            journals = journal_query.order_by(desc(DailyCheckin.date)).limit(journal_limit).all()
            if not journals and intent == "JOURNAL":
                journals = db.session.query(JournalEntry).join(DailyCheckin).filter(DailyCheckin.user_id == user_id).order_by(desc(DailyCheckin.date)).limit(journal_limit).all()
            for j in journals:
                content = f"Title: {j.title or 'Untitled'}\nDate: {j.checkin.date.isoformat()}\nContent: {j.content}"
                context["journals"].append({
                    "type": "journal",
                    "id": j.id,
                    "title": j.title or f"Journal on {j.checkin.date}",
                    "date": j.checkin.date.isoformat(),
                    "label": f"Journal — {j.checkin.date.strftime('%b %d')}",
                    "content": content
                })

        # 3. Goals
        goal_query = Goal.query.filter_by(user_id=user_id)
        if start_date:
            goal_query = goal_query.filter(Goal.created_at >= start_date)
        if end_date:
            goal_query = goal_query.filter(Goal.created_at <= end_date)
        if specific_terms:
            filters = []
            for term in specific_terms:
                term_ilike = f"%{term}%"
                filters.append(
                    or_(
                        Goal.title.ilike(term_ilike),
                        Goal.category.ilike(term_ilike)
                    )
                )
            goal_query = goal_query.filter(or_(*filters))
        goal_limit = 15 if intent == "GOAL" else 5
        goals = goal_query.order_by(desc(Goal.created_at)).limit(goal_limit).all()
        if not goals and intent == "GOAL":
            goals = Goal.query.filter_by(user_id=user_id).order_by(desc(Goal.created_at)).limit(goal_limit).all()
        for g in goals:
            content = f"Title: {g.title}\nStatus: {g.status}\nProgress: {g.progress}/{g.target}\nCategory: {g.category}\nCreated: {g.created_at.isoformat() if g.created_at else 'Unknown'}\nDeadline: {g.deadline.isoformat() if g.deadline else 'None'}"
            context["goals"].append({
                "type": "goal",
                "id": g.id,
                "title": g.title,
                "date": g.created_at.isoformat() if g.created_at else None,
                "label": f"Goal — {g.title[:15]}",
                "content": content
            })

        # 4. Habits
        habit_query = Habit.query.filter_by(user_id=user_id)
        if start_date:
            habit_query = habit_query.filter(Habit.created_at >= start_date)
        if end_date:
            habit_query = habit_query.filter(Habit.created_at <= end_date)
        if specific_terms:
            filters = []
            for term in specific_terms:
                term_ilike = f"%{term}%"
                filters.append(Habit.name.ilike(term_ilike))
            habit_query = habit_query.filter(or_(*filters))
        habit_limit = 15 if intent == "HABIT" else 5
        habits = habit_query.order_by(desc(Habit.created_at)).limit(habit_limit).all()
        if not habits and intent == "HABIT":
            habits = Habit.query.filter_by(user_id=user_id).order_by(desc(Habit.created_at)).limit(habit_limit).all()
        for h in habits:
            content = f"Habit: {h.name}\nFrequency: {h.frequency}\nStatus: {h.status}\nCurrent Streak: {h.current_streak}\nLongest Streak: {h.longest_streak}"
            context["habits"].append({
                "type": "habit",
                "id": h.id,
                "title": h.name,
                "date": h.created_at.isoformat() if h.created_at else None,
                "label": f"Habit — {h.name[:15]}",
                "content": content
            })

        # 5. Skills
        skill_query = Skill.query.filter_by(user_id=user_id)
        if start_date:
            skill_query = skill_query.filter(Skill.created_at >= start_date)
        if end_date:
            skill_query = skill_query.filter(Skill.created_at <= end_date)
        if specific_terms:
            filters = []
            for term in specific_terms:
                term_ilike = f"%{term}%"
                filters.append(
                    or_(
                        Skill.name.ilike(term_ilike),
                        Skill.category.ilike(term_ilike)
                    )
                )
            skill_query = skill_query.filter(or_(*filters))
        skill_limit = 10 if intent == "SKILL" else 5
        skills = skill_query.order_by(desc(Skill.created_at)).limit(skill_limit).all()
        if not skills and intent == "SKILL":
            skills = Skill.query.filter_by(user_id=user_id).order_by(desc(Skill.created_at)).limit(skill_limit).all()
        for s in skills:
            content = f"Skill: {s.name}\nCategory: {s.category}\nLevel: {s.level}\nProgress: {s.progress}"
            context["skills"].append({
                "type": "skill",
                "id": s.id,
                "title": s.name,
                "date": s.created_at.isoformat() if s.created_at else None,
                "label": f"Skill — Lvl {s.level}",
                "content": content
            })

        # 6. Achievements
        ach_query = Achievement.query.filter_by(user_id=user_id)
        if start_date:
            ach_query = ach_query.filter(Achievement.unlocked_at >= start_date)
        if end_date:
            ach_query = ach_query.filter(Achievement.unlocked_at <= end_date)
        if specific_terms:
            filters = []
            for term in specific_terms:
                term_ilike = f"%{term}%"
                filters.append(
                    or_(
                        Achievement.name.ilike(term_ilike),
                        Achievement.description.ilike(term_ilike)
                    )
                )
            ach_query = ach_query.filter(or_(*filters))
        ach_limit = 10 if intent == "ACHIEVEMENT" else 5
        achs = ach_query.order_by(desc(Achievement.unlocked_at)).limit(ach_limit).all()
        if not achs and intent == "ACHIEVEMENT":
            achs = Achievement.query.filter_by(user_id=user_id).order_by(desc(Achievement.unlocked_at)).limit(ach_limit).all()
        for a in achs:
            content = f"Achievement: {a.name}\nDescription: {a.description}\nUnlocked: {a.unlocked_at.isoformat() if a.unlocked_at else 'Unknown'}"
            context["achievements"].append({
                "type": "achievement",
                "id": a.id,
                "title": a.name,
                "date": a.unlocked_at.isoformat() if a.unlocked_at else None,
                "label": f"Achievement",
                "content": content
            })

        # 7. Timeline (Checkins)
        checkin_query = DailyCheckin.query.options(
            db.joinedload(DailyCheckin.mood), 
            db.joinedload(DailyCheckin.activities),
            db.joinedload(DailyCheckin.wellbeing),
            db.joinedload(DailyCheckin.journal),
            db.joinedload(DailyCheckin.habit_logs)
        ).filter_by(user_id=user_id)
        
        if start_date:
            checkin_query = checkin_query.filter(DailyCheckin.date >= start_date)
        if end_date:
            checkin_query = checkin_query.filter(DailyCheckin.date <= end_date)
        
        timeline_limit = 25 if intent in ["TEMPORAL", "COMPARISON", "GENERAL_REPLAY"] else 15
        
        # Priority checkins matching search terms
        priority_checkins = []
        if search_terms:
            priority_query = checkin_query
            filters = []
            for term in search_terms:
                term_ilike = f"%{term}%"
                filters.append(DailyCheckin.journal.has(JournalEntry.content.ilike(term_ilike)))
                filters.append(DailyCheckin.habit_logs.any(HabitLog.name.ilike(term_ilike)))
            if filters:
                priority_query = priority_query.filter(or_(*filters))
                priority_checkins = priority_query.order_by(desc(DailyCheckin.date)).limit(timeline_limit).all()
        
        # General checkins
        general_limit = timeline_limit - len(priority_checkins)
        general_checkins = []
        if general_limit > 0:
            existing_ids = [c.id for c in priority_checkins]
            general_q = checkin_query
            if existing_ids:
                general_q = general_q.filter(~DailyCheckin.id.in_(existing_ids))
            general_checkins = general_q.order_by(desc(DailyCheckin.date)).limit(general_limit).all()

        priority_checkins.sort(key=lambda x: x.date, reverse=True)
        general_checkins.sort(key=lambda x: x.date, reverse=True)
        checkins = priority_checkins + general_checkins

        for c in checkins:
            lines = []
            lines.append(f"Date: {c.date.isoformat()}")
            lines.append(f"Daily Rating: {c.daily_rating}/5")
            if c.mood:
                lines.append(f"Mood Score: {c.mood.mood_score}/5")
            if c.wellbeing:
                lines.append(f"Energy: {c.wellbeing.energy_level}/5 | Stress: {c.wellbeing.stress_level}/5 | Focus: {c.wellbeing.focus_level}/5 | Motivation: {c.wellbeing.motivation_level}/5")
            if c.activities:
                act = []
                if c.activities.sleep_hours: act.append(f"Sleep: {c.activities.sleep_hours}h")
                if c.activities.water_intake_ml: act.append(f"Water: {c.activities.water_intake_ml}ml")
                if c.activities.study_hours: act.append(f"Study: {c.activities.study_hours}h")
                if c.activities.work_hours: act.append(f"Work: {c.activities.work_hours}h")
                if c.activities.meditation_minutes: act.append(f"Meditation: {c.activities.meditation_minutes}m")
                if c.activities.walking_steps: act.append(f"Steps: {c.activities.walking_steps}")
                if c.activities.exercise_minutes: act.append(f"Exercise: {c.activities.exercise_minutes}m")
                if c.activities.reading_minutes: act.append(f"Reading: {c.activities.reading_minutes}m")
                if act: lines.append("Activities: " + ", ".join(act))
            
            completed_habits = [hl.name for hl in c.habit_logs if hl.completed]
            if completed_habits:
                lines.append(f"Completed Habits: {', '.join(completed_habits)}")
                
            if c.journal and c.journal.content:
                lines.append(f"Reflection: {c.journal.content}")

            context["timeline"].append({
                "type": "timeline",
                "id": c.id,
                "title": f"Check-in on {c.date.isoformat()}",
                "date": c.date.isoformat(),
                "label": f"Check-in — {c.date.strftime('%b %d')}",
                "mood_score": c.mood.mood_score if c.mood else None,
                "content": "\n".join(lines)
            })

        return context

