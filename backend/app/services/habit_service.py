from app.extensions import db
from app.models import Habit, HabitLog, DailyCheckin
from datetime import datetime, date, timedelta

class HabitService:
    @staticmethod
    def _get_user_today(user_id):
        from app.models import User
        user = User.query.get(user_id)
        if user and user.timezone and user.timezone != 'UTC':
            try:
                import zoneinfo
                from datetime import datetime
                tz = zoneinfo.ZoneInfo(user.timezone)
                return datetime.now(tz).date()
            except Exception:
                pass
        return date.today()

    @staticmethod
    def get_habits(user_id):
        habits = Habit.query.filter_by(user_id=user_id).order_by(Habit.created_at.desc()).all()
        
        today = HabitService._get_user_today(user_id)
        completed_logs = HabitLog.query.join(DailyCheckin).filter(
            DailyCheckin.user_id == user_id,
            DailyCheckin.date == today,
            HabitLog.completed == True
        ).all()
        completed_habit_ids = {log.habit_id for log in completed_logs}
        
        return [HabitService._format_habit(h, completed_today=(h.id in completed_habit_ids)) for h in habits], 200

    @staticmethod
    def get_habit(user_id, habit_id):
        habit = Habit.query.filter_by(id=habit_id, user_id=user_id).first()
        if not habit:
            return {'success': False, 'error': 'Habit not found'}, 404
            
        today = HabitService._get_user_today(user_id)
        log = HabitLog.query.join(DailyCheckin).filter(
            DailyCheckin.user_id == user_id,
            DailyCheckin.date == today,
            HabitLog.habit_id == habit_id,
            HabitLog.completed == True
        ).first()
        
        return HabitService._format_habit(habit, completed_today=bool(log)), 200

    @staticmethod
    def create_habit(user_id, data):
        habit = Habit(
            user_id=user_id,
            name=data.get('name'),
            icon=data.get('icon', '✨'),
            frequency=data.get('frequency', 'daily'),
            status=data.get('status', 'active')
        )
        db.session.add(habit)
        db.session.commit()
        return HabitService._format_habit(habit), 201

    @staticmethod
    def update_habit(user_id, habit_id, data):
        habit = Habit.query.filter_by(id=habit_id, user_id=user_id).first()
        if not habit:
            return {'success': False, 'error': 'Habit not found'}, 404
            
        for key, value in data.items():
            if hasattr(habit, key):
                setattr(habit, key, value)
                
        db.session.commit()
        
        today = HabitService._get_user_today(user_id)
        log = HabitLog.query.join(DailyCheckin).filter(
            DailyCheckin.user_id == user_id,
            DailyCheckin.date == today,
            HabitLog.habit_id == habit_id,
            HabitLog.completed == True
        ).first()
        
        return HabitService._format_habit(habit, completed_today=bool(log)), 200

    @staticmethod
    def record_completion(user_id, habit_id, target_date=None, completed=True):
        habit = Habit.query.filter_by(id=habit_id, user_id=user_id).first()
        if not habit:
            return {'success': False, 'error': 'Habit not found'}, 404
            
        today = HabitService._get_user_today(user_id)
        if target_date is None:
            target_date = today

        if target_date > today:
            return {'success': False, 'error': 'Cannot record completion for future dates'}, 400

        # Find if a checkin exists for this date, or create one (HabitLogs are tied to DailyCheckin in this schema)
        from app.models import DailyCheckin
        checkin = DailyCheckin.query.filter_by(user_id=user_id, date=target_date).first()
        if not checkin:
            checkin = DailyCheckin(user_id=user_id, date=target_date)
            db.session.add(checkin)
            db.session.flush()

        log = HabitLog.query.filter_by(habit_id=habit_id, daily_checkin_id=checkin.id).first()
        
        if not log:
            log = HabitLog(user_id=user_id, daily_checkin_id=checkin.id, habit_id=habit_id, name=habit.name)
            db.session.add(log)
            
        log.completed = completed
        db.session.commit()
        
        if completed:
            from app.services.gamification_service import GamificationService
            GamificationService.award_xp(user_id, "habit", f"habit_log:{log.id}", 5, f"Completed Habit: {habit.name}")
        
        HabitService._recalculate_streaks(habit_id)
        
        # reload habit to get updated streaks
        habit = Habit.query.get(habit_id)
        
        # Since we just recorded completion, if the target date is today, we know the status.
        # If it's a past date, we should still query today's status to be accurate.
        is_today = (target_date == today)
        if is_today:
            completed_today = completed
        else:
            today_log = HabitLog.query.join(DailyCheckin).filter(
                DailyCheckin.user_id == user_id,
                DailyCheckin.date == today,
                HabitLog.habit_id == habit_id,
                HabitLog.completed == True
            ).first()
            completed_today = bool(today_log)
            
        return HabitService._format_habit(habit, completed_today=completed_today), 200

    @staticmethod
    def _recalculate_streaks(habit_id):
        habit = Habit.query.get(habit_id)
        if not habit: return
        
        logs = HabitLog.query.filter_by(habit_id=habit_id, completed=True).join(DailyCheckin).order_by(DailyCheckin.date.desc()).all()
        
        if not logs:
            habit.current_streak = 0
            habit.longest_streak = 0
            db.session.commit()
            return
            
        dates = sorted([log.checkin.date for log in logs], reverse=True)
        
        current_streak = 0
        longest_streak = 0
        temp_streak = 0
        
        today = date.today()
        
        # Current streak logic
        if dates and (dates[0] == today or dates[0] == (today - timedelta(days=1))):
            current_streak = 1
            for i in range(1, len(dates)):
                if (dates[i-1] - dates[i]).days == 1:
                    current_streak += 1
                elif (dates[i-1] - dates[i]).days > 1:
                    break
        
        # Longest streak logic
        if dates:
            temp_streak = 1
            longest_streak = 1
            for i in range(1, len(dates)):
                if (dates[i-1] - dates[i]).days == 1:
                    temp_streak += 1
                    if temp_streak > longest_streak:
                        longest_streak = temp_streak
                elif (dates[i-1] - dates[i]).days > 1:
                    temp_streak = 1

        habit.current_streak = current_streak
        if longest_streak > habit.longest_streak:
            habit.longest_streak = longest_streak
            
        db.session.commit()

    @staticmethod
    def get_habit_history(user_id, habit_id):
        habit = Habit.query.filter_by(id=habit_id, user_id=user_id).first()
        if not habit:
            return {'success': False, 'error': 'Habit not found'}, 404
            
        logs = HabitLog.query.filter_by(habit_id=habit_id, completed=True).join(DailyCheckin).order_by(DailyCheckin.date.desc()).all()
        history = [log.checkin.date.isoformat() for log in logs if log.checkin]
        
        return {'history': history, 'completion_count': len(history)}, 200

    @staticmethod
    def _format_habit(habit, completed_today=False):
        return {
            'id': habit.id,
            'name': habit.name,
            'icon': habit.icon,
            'frequency': habit.frequency,
            'status': habit.status,
            'current_streak': habit.current_streak,
            'longest_streak': habit.longest_streak,
            'created_at': habit.created_at.isoformat() if habit.created_at else None,
            'completed_today': completed_today
        }
