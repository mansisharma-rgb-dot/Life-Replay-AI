from app.models.goal import Goal
from app.models.habit import Habit
from app.models.journal_entry import JournalEntry
from app.models.achievement import Achievement
from app.services.achievement_service import AVAILABLE_ACHIEVEMENTS

class SearchService:
    @staticmethod
    def search(user_id, query):
        if not query or len(query) < 2:
            return {"goals": [], "habits": [], "journals": [], "achievements": []}
            
        search_term = f"%{query}%"
        
        # 1. Search Goals
        goals = Goal.query.filter(
            Goal.user_id == user_id,
            (Goal.title.ilike(search_term)) | (Goal.description.ilike(search_term))
        ).limit(5).all()
        goals_data = [{"id": g.id, "title": g.title, "type": "goal", "link": "/goals"} for g in goals]
        
        # 2. Search Habits
        habits = Habit.query.filter(
            Habit.user_id == user_id,
            Habit.name.ilike(search_term)
        ).limit(5).all()
        habits_data = [{"id": h.id, "title": h.name, "type": "habit", "link": "/habits"} for h in habits]
        
        # 3. Search Journals
        journals = JournalEntry.query.filter(
            JournalEntry.user_id == user_id,
            (JournalEntry.title.ilike(search_term)) | (JournalEntry.content.ilike(search_term))
        ).limit(5).all()
        journals_data = [{"id": j.id, "title": j.title, "type": "journal", "link": "/journal"} for j in journals]
        
        # 4. Search Achievements
        # First check DB unlocked achievements matching the term
        unlocked = Achievement.query.filter(
            Achievement.user_id == user_id,
            Achievement.name.ilike(search_term)
        ).all()
        unlocked_names = {a.name for a in unlocked}
        
        # Then search the static available achievements matching the term
        achievements_data = []
        for ach in AVAILABLE_ACHIEVEMENTS:
            if query.lower() in ach["name"].lower() or query.lower() in ach["description"].lower():
                is_unlocked = ach["name"] in unlocked_names
                achievements_data.append({
                    "id": ach["id_str"],
                    "title": ach["name"],
                    "description": ach["description"],
                    "type": "achievement",
                    "is_unlocked": is_unlocked,
                    "link": "/achievements"
                })
                if len(achievements_data) >= 5:
                    break

        return {
            "goals": goals_data,
            "habits": habits_data,
            "journals": journals_data,
            "achievements": achievements_data
        }
