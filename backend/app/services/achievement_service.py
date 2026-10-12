from datetime import datetime, time
from app.models.achievement import Achievement
from app.models.daily_checkin import DailyCheckin
from app.models.journal_entry import JournalEntry
from app.models.goal import Goal
from app.models.habit import Habit
from app.models.habit_log import HabitLog
from app.models.skill import Skill
from app.models.user import User
from app.extensions import db
from sqlalchemy import or_

# Static list of all available achievements in Life Replay AI
AVAILABLE_ACHIEVEMENTS = [
    {"id_str": "first_checkin", "name": "First Step", "description": "Complete your first daily check-in", "icon": "Target"},
    {"id_str": "streak_7", "name": "7-Day Streak", "description": "Maintain a check-in streak for 7 consecutive days", "icon": "Flame"},
    {"id_str": "streak_30", "name": "Monthly Master", "description": "Maintain a check-in streak for 30 consecutive days", "icon": "Award"},
    {"id_str": "goal_crusher", "name": "Goal Crusher", "description": "Complete your first goal", "icon": "Trophy"},
    {"id_str": "journal_entry_10", "name": "Reflective Soul", "description": "Write 10 journal entries", "icon": "BookOpen"},
    {"id_str": "early_bird", "name": "Early Bird", "description": "Check in before 8 AM", "icon": "Sun"},
    {"id_str": "night_owl", "name": "Night Owl", "description": "Check in after 10 PM", "icon": "Moon"},
    {"id_str": "skill_apprentice", "name": "Apprentice", "description": "Reach Level 5 in any skill", "icon": "TrendingUp"},
    {"id_str": "perfect_week", "name": "Perfect Week", "description": "Complete all habits for 7 days straight", "icon": "Star"},
]

class AchievementService:
    @staticmethod
    def evaluate_user_achievements(user_id):
        """
        Evaluates real database activity for user_id and automatically unlocks eligible achievements.
        """
        user_id = int(user_id)
        user = db.session.get(User, user_id)
        if not user:
            return

        unlocked = Achievement.query.filter_by(user_id=user_id).all()
        unlocked_names = {a.name for a in unlocked}

        to_unlock = []

        # 1. FIRST STEP: At least 1 completed check-in
        if "First Step" not in unlocked_names:
            completed_checkins = DailyCheckin.query.filter_by(user_id=user_id, is_completed=True).count()
            if completed_checkins >= 1:
                to_unlock.append("first_checkin")

        # 2. 7-DAY STREAK: 7 consecutive days with completed check-ins
        if "7-Day Streak" not in unlocked_names:
            if (user.current_streak and user.current_streak >= 7) or (user.longest_streak and user.longest_streak >= 7):
                to_unlock.append("streak_7")
            else:
                # Also verify total completed check-ins count if streak was not updated
                count = DailyCheckin.query.filter_by(user_id=user_id, is_completed=True).count()
                if count >= 7:
                    to_unlock.append("streak_7")

        # 3. MONTHLY MASTER: 30 consecutive days with completed check-ins
        if "Monthly Master" not in unlocked_names:
            if (user.current_streak and user.current_streak >= 30) or (user.longest_streak and user.longest_streak >= 30):
                to_unlock.append("streak_30")

        # 4. GOAL CRUSHER: At least 1 goal completed
        if "Goal Crusher" not in unlocked_names:
            completed_goal = Goal.query.filter(
                Goal.user_id == user_id,
                or_(Goal.status == 'completed', Goal.progress >= Goal.target)
            ).first()
            if completed_goal:
                to_unlock.append("goal_crusher")

        # 5. REFLECTIVE SOUL: At least 10 journal/reflection entries
        if "Reflective Soul" not in unlocked_names:
            journal_count = db.session.query(JournalEntry).join(DailyCheckin).filter(
                DailyCheckin.user_id == user_id,
                or_(
                    db.func.length(JournalEntry.content) > 5,
                    db.func.length(JournalEntry.title) > 3
                )
            ).count()
            if journal_count >= 10:
                to_unlock.append("journal_entry_10")

        # 6. EARLY BIRD: Check in before 8 AM
        if "Early Bird" not in unlocked_names:
            early_checkin = DailyCheckin.query.filter(
                DailyCheckin.user_id == user_id,
                DailyCheckin.created_at != None,
                db.extract('hour', DailyCheckin.created_at) < 8
            ).first()
            if early_checkin:
                to_unlock.append("early_bird")

        # 7. NIGHT OWL: Check in after 10 PM (22:00)
        if "Night Owl" not in unlocked_names:
            night_checkin = DailyCheckin.query.filter(
                DailyCheckin.user_id == user_id,
                DailyCheckin.created_at != None,
                db.extract('hour', DailyCheckin.created_at) >= 22
            ).first()
            if night_checkin:
                to_unlock.append("night_owl")

        # 8. APPRENTICE: Reach Level 5 in any tracked skill
        if "Apprentice" not in unlocked_names:
            lvl5_skill = Skill.query.filter(
                Skill.user_id == user_id,
                Skill.level >= 5
            ).first()
            if lvl5_skill:
                to_unlock.append("skill_apprentice")

        # 9. PERFECT WEEK: Complete habits for 7 consecutive days or habit streak >= 7
        if "Perfect Week" not in unlocked_names:
            high_streak_habit = Habit.query.filter(
                Habit.user_id == user_id,
                or_(Habit.current_streak >= 7, Habit.longest_streak >= 7)
            ).first()
            if high_streak_habit:
                to_unlock.append("perfect_week")
            else:
                # Check distinct completed habit log days
                completed_habit_days = db.session.query(db.func.count(db.func.distinct(HabitLog.daily_checkin_id))).filter(
                    HabitLog.user_id == user_id,
                    HabitLog.completed == True
                ).scalar() or 0
                if completed_habit_days >= 7:
                    to_unlock.append("perfect_week")

        for ach_id in to_unlock:
            AchievementService.award_achievement(user_id, ach_id)

    @staticmethod
    def get_user_achievements(user_id):
        user_id = int(user_id)
        # Evaluate achievements before returning
        try:
            AchievementService.evaluate_user_achievements(user_id)
        except Exception as e:
            db.session.rollback()
            print(f"Error evaluating achievements: {e}")

        # Fetch unlocked achievements from DB
        unlocked = Achievement.query.filter_by(user_id=user_id).all()
        
        # Create a dictionary of unlocked achievement names for easy lookup
        unlocked_map = {a.name: a for a in unlocked}
        
        results = []
        for ach in AVAILABLE_ACHIEVEMENTS:
            is_unlocked = ach["name"] in unlocked_map
            ach_record = unlocked_map.get(ach["name"])
            
            achievement_data = {
                "id_str": ach["id_str"],
                "name": ach["name"],
                "description": ach["description"],
                "icon": ach["icon"],
                "is_unlocked": is_unlocked,
                "unlocked_at": ach_record.unlocked_at.isoformat() if is_unlocked and ach_record and ach_record.unlocked_at else None
            }
            results.append(achievement_data)
            
        return results

    @staticmethod
    def award_achievement(user_id, achievement_id_str):
        ach_def = next((a for a in AVAILABLE_ACHIEVEMENTS if a["id_str"] == achievement_id_str), None)
        if not ach_def:
            return False, "Achievement does not exist"
            
        # Check if already unlocked
        existing = Achievement.query.filter_by(user_id=user_id, name=ach_def["name"]).first()
        if existing:
            return False, "Already unlocked"
            
        new_ach = Achievement(
            user_id=user_id,
            name=ach_def["name"],
            description=ach_def["description"],
            icon=ach_def["icon"],
            unlocked_at=datetime.utcnow()
        )
        db.session.add(new_ach)
        db.session.commit()
        
        try:
            from app.services.gamification_service import GamificationService
            GamificationService.award_xp(user_id, "achievement", f"achievement:{ach_def['id_str']}", 25, f"Unlocked: {ach_def['name']}")
        except Exception:
            pass
            
        return True, "Achievement unlocked"

