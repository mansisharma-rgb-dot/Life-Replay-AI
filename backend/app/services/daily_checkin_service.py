from app.extensions import db
from app.models import User, DailyCheckin, Activities, MoodLog, Wellbeing, JournalEntry, LifeScore
from app.services.life_score_service import LifeScoreService
from datetime import date, timedelta
import math

class DailyCheckinService:
    @staticmethod
    def _get_user_today(user_id):
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
    def get_today(user_id):
        from sqlalchemy.orm import joinedload
        today = DailyCheckinService._get_user_today(user_id)
        checkin = DailyCheckin.query.options(
            joinedload(DailyCheckin.activities),
            joinedload(DailyCheckin.mood),
            joinedload(DailyCheckin.wellbeing),
            joinedload(DailyCheckin.journal),
            joinedload(DailyCheckin.habit_logs)
        ).filter_by(user_id=user_id, date=today).first()
        
        if not checkin:
            return {
                'activities': {},
                'mood': {},
                'wellbeing': {},
                'journal': {},
                'daily_rating': 0,
                'is_completed': False,
                'life_score': None
            }, 200
            
        return DailyCheckinService._format_checkin(checkin), 200

    @staticmethod
    def upsert_checkin(user_id, data):
        user_id = int(user_id)
        target_date = data.get('date')
        if not target_date:
            target_date = DailyCheckinService._get_user_today(user_id)
        elif isinstance(target_date, str):
            try:
                target_date = date.fromisoformat(target_date.split('T')[0])
            except Exception:
                target_date = DailyCheckinService._get_user_today(user_id)

        checkin = DailyCheckin.query.filter_by(user_id=user_id, date=target_date).first()
        
        is_new_completion = False
        if not checkin:
            checkin = DailyCheckin(user_id=user_id, date=target_date)
            db.session.add(checkin)
            db.session.flush() # flush to get ID
            
        # If it was already completed previously, do not award XP again for autosaves or re-submits
        if not checkin.is_completed and data.get('is_completed'):
            is_new_completion = True
            
        checkin.is_completed = data.get('is_completed', False)
        checkin.daily_rating = data.get('daily_rating', 0)

        # Upsert Activities
        act_data = data.get('activities', {})
        if not checkin.activities:
            checkin.activities = Activities(daily_checkin_id=checkin.id)
        for k, v in act_data.items():
            setattr(checkin.activities, k, v)

        # Upsert Mood
        mood_data = data.get('mood', {})
        if not checkin.mood:
            checkin.mood = MoodLog(daily_checkin_id=checkin.id)
        for k, v in mood_data.items():
            setattr(checkin.mood, k, v)

        # Upsert Wellbeing
        wb_data = data.get('wellbeing', {})
        if not checkin.wellbeing:
            checkin.wellbeing = Wellbeing(daily_checkin_id=checkin.id)
        for k, v in wb_data.items():
            setattr(checkin.wellbeing, k, v)

        # Upsert Journal
        j_data = data.get('journal', {})
        if not checkin.journal:
            checkin.journal = JournalEntry(daily_checkin_id=checkin.id)
        for k, v in j_data.items():
            setattr(checkin.journal, k, v)
        db.session.flush()
            
        if checkin.journal and checkin.journal.content and len(checkin.journal.content.strip()) > 10:
            from app.services.gamification_service import GamificationService
            GamificationService.award_xp(user_id, "journal", f"journal:{checkin.id}", 10, "Journal Entry Created")
            # Check "Reflective Soul" achievement (10 journal entries with real content)
            from sqlalchemy import func
            total_journals = db.session.query(func.count(JournalEntry.id)).join(
                DailyCheckin, JournalEntry.daily_checkin_id == DailyCheckin.id
            ).filter(
                DailyCheckin.user_id == user_id,
                func.length(JournalEntry.content) > 10
            ).scalar() or 0
            if total_journals >= 10:
                from app.services.achievement_service import AchievementService
                AchievementService.award_achievement(user_id, "journal_entry_10")


        if data.get('is_completed'):
            # 1. Calculate Life Score
            score, breakdown = LifeScoreService.calculate(act_data, mood_data, wb_data)
            
            ls = LifeScore.query.filter_by(user_id=user_id, date=target_date).first()
            if not ls:
                ls = LifeScore(user_id=user_id, date=target_date)
                db.session.add(ls)
            ls.score = score
            ls.breakdown = breakdown

        if is_new_completion:
            # 2. Gamification (XP and Streak)
            user = User.query.get(user_id)
            from app.services.gamification_service import GamificationService
            GamificationService.award_xp(user_id, "checkin", f"checkin:{checkin.id}", 10, "Daily Check-in")
            
            # Update Streak
            yesterday = target_date - timedelta(days=1)
            yesterday_checkin = DailyCheckin.query.filter_by(user_id=user_id, date=yesterday, is_completed=True).first()
            
            if yesterday_checkin:
                user.current_streak += 1
            else:
                user.current_streak = max(user.current_streak, 1)
                
            if user.current_streak > user.longest_streak:
                user.longest_streak = user.current_streak

        db.session.commit()

        # 3. Achievements (evaluated after commit so XP award is visible)
        if is_new_completion:
            from app.services.achievement_service import AchievementService
            from datetime import datetime

            # "First Step" — awarded on very first completed check-in
            total_completed = DailyCheckin.query.filter_by(user_id=user_id, is_completed=True).count()
            if total_completed == 1:
                AchievementService.award_achievement(user_id, "first_checkin")

            # Reload user to get updated streak
            user = User.query.get(user_id)

            # "7-Day Streak" achievement
            if user.current_streak >= 7:
                AchievementService.award_achievement(user_id, "streak_7")

            # "Monthly Master" (30-day streak)
            if user.current_streak >= 30:
                AchievementService.award_achievement(user_id, "streak_30")

            # "Early Bird" — check-in before 8 AM
            now_hour = datetime.now().hour
            try:
                if user.timezone and user.timezone != 'UTC':
                    import zoneinfo
                    tz = zoneinfo.ZoneInfo(user.timezone)
                    now_hour = datetime.now(tz).hour
            except Exception:
                pass
            if now_hour < 8:
                AchievementService.award_achievement(user_id, "early_bird")

            # "Night Owl" — check-in at or after 22:00 (10 PM)
            if now_hour >= 22:
                AchievementService.award_achievement(user_id, "night_owl")
        return DailyCheckinService._format_checkin(checkin), 200

    @staticmethod
    def get_history(user_id, page=1, per_page=50, start_date=None, end_date=None, period=None):
        user_id = int(user_id)
        from sqlalchemy.orm import joinedload
        from datetime import date, timedelta
        
        query = DailyCheckin.query.options(
            joinedload(DailyCheckin.activities),
            joinedload(DailyCheckin.mood),
            joinedload(DailyCheckin.wellbeing),
            joinedload(DailyCheckin.journal),
            joinedload(DailyCheckin.habit_logs)
        ).filter_by(user_id=user_id)
        
        today = DailyCheckinService._get_user_today(user_id)
        
        if period == 'this_week':
            monday = today - timedelta(days=today.weekday())
            query = query.filter(DailyCheckin.date >= monday, DailyCheckin.date <= today)
        elif period == 'last_week':
            last_monday = today - timedelta(days=today.weekday() + 7)
            last_sunday = last_monday + timedelta(days=6)
            query = query.filter(DailyCheckin.date >= last_monday, DailyCheckin.date <= last_sunday)
        elif period == 'this_month':
            first_of_month = today.replace(day=1)
            query = query.filter(DailyCheckin.date >= first_of_month, DailyCheckin.date <= today)
        elif period == 'last_month':
            first_of_this_month = today.replace(day=1)
            last_day_of_last_month = first_of_this_month - timedelta(days=1)
            first_of_last_month = last_day_of_last_month.replace(day=1)
            query = query.filter(DailyCheckin.date >= first_of_last_month, DailyCheckin.date <= last_day_of_last_month)
            
        if start_date:
            if isinstance(start_date, str):
                try:
                    start_date = date.fromisoformat(start_date.split('T')[0])
                except Exception:
                    pass
            if isinstance(start_date, date):
                query = query.filter(DailyCheckin.date >= start_date)
                
        if end_date:
            if isinstance(end_date, str):
                try:
                    end_date = date.fromisoformat(end_date.split('T')[0])
                except Exception:
                    pass
            if isinstance(end_date, date):
                query = query.filter(DailyCheckin.date <= end_date)
                
        pagination = query.order_by(DailyCheckin.date.desc()).paginate(page=page, per_page=per_page, error_out=False)
        
        dates = [c.date for c in pagination.items]
        life_scores = {}
        if dates:
            ls_records = LifeScore.query.filter(
                LifeScore.user_id == user_id,
                LifeScore.date.in_(dates)
            ).all()
            for ls in ls_records:
                life_scores[ls.date] = {
                    'total_score': ls.score,
                    'breakdown': ls.breakdown
                }
                
        items = []
        for checkin in pagination.items:
            ls_data = life_scores.get(checkin.date)
            score_val = ls_data['total_score'] if ls_data else None
            
            acts = checkin.activities
            has_activities = acts is not None
            
            mood = checkin.mood
            has_mood = mood is not None
            
            wb = checkin.wellbeing
            has_wellbeing = wb is not None
            
            j = checkin.journal
            has_journal = j is not None
            
            habit_logs_formatted = []
            for log in (checkin.habit_logs or []):
                habit_logs_formatted.append({
                    'id': log.id,
                    'habit_id': log.habit_id,
                    'name': log.name or (log.habit.name if log.habit else 'Habit'),
                    'icon': log.habit.icon if log.habit else '✨',
                    'streak': log.habit.current_streak if log.habit else 0,
                    'completed': log.completed
                })
                
            items.append({
                'id': checkin.id,
                'date': checkin.date.isoformat(),
                'is_completed': checkin.is_completed,
                'daily_rating': checkin.daily_rating,
                'life_score': score_val,
                'life_score_details': ls_data,
                'has_activities': has_activities,
                'activities': {
                    'study_hours': acts.study_hours if has_activities else 0,
                    'work_hours': acts.work_hours if has_activities else 0,
                    'exercise_minutes': acts.exercise_minutes if has_activities else 0,
                    'reading_minutes': acts.reading_minutes if has_activities else 0,
                    'meditation_minutes': acts.meditation_minutes if has_activities else 0,
                    'sleep_hours': acts.sleep_hours if has_activities else 0,
                    'water_intake_ml': acts.water_intake_ml if has_activities else 0,
                    'screen_time_minutes': acts.screen_time_minutes if has_activities else 0,
                    'leisure_hours': acts.leisure_hours if has_activities else 0,
                    'walking_steps': acts.walking_steps if has_activities else 0,
                    'calories_burned': acts.calories_burned if has_activities else 0,
                },
                'has_mood': has_mood,
                'mood': {
                    'mood_score': mood.mood_score if has_mood else None,
                    'intensity': mood.intensity if has_mood else None,
                    'mood_label': mood.mood_label if has_mood else None,
                    'note': mood.note if has_mood else '',
                },
                'has_wellbeing': has_wellbeing,
                'wellbeing': {
                    'energy_level': wb.energy_level if has_wellbeing else None,
                    'stress_level': wb.stress_level if has_wellbeing else None,
                    'focus_level': wb.focus_level if has_wellbeing else None,
                    'motivation_level': wb.motivation_level if has_wellbeing else None,
                },
                'has_journal': has_journal,
                'journal': {
                    'title': j.title if has_journal else '',
                    'content': j.content if has_journal else '',
                },
                'habit_logs': habit_logs_formatted,
                'summary': {
                    'mood': mood.mood_label if mood else None,
                    'journal_title': j.title if j else None
                }
            })
            
        return {
            'items': items,
            'checkins': items,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }, 200

    @staticmethod
    def get_by_date(user_id, target_date):
        user_id = int(user_id)
        from sqlalchemy.orm import joinedload
        from datetime import date
        
        if isinstance(target_date, str):
            try:
                target_date = date.fromisoformat(target_date)
            except ValueError:
                return {'success': False, 'error': 'Invalid date format. Expected YYYY-MM-DD'}, 400
                
        checkin = DailyCheckin.query.options(
            joinedload(DailyCheckin.activities),
            joinedload(DailyCheckin.mood),
            joinedload(DailyCheckin.wellbeing),
            joinedload(DailyCheckin.journal),
            joinedload(DailyCheckin.habit_logs)
        ).filter_by(user_id=user_id, date=target_date).first()
        
        if not checkin:
            return {
                'id': None,
                'date': target_date.isoformat(),
                'found': False,
                'is_completed': False,
                'daily_rating': 0,
                'life_score': None,
                'activities': {},
                'mood': {},
                'wellbeing': {},
                'journal': {},
                'habit_logs': [],
                'goals': []
            }, 200
            
        formatted = DailyCheckinService._format_checkin(checkin)
        formatted['found'] = True
        return formatted, 200

    @staticmethod
    def _format_checkin(checkin):
        from app.models import Goal
        ls = LifeScore.query.filter_by(user_id=checkin.user_id, date=checkin.date).first()
        
        habit_logs_formatted = []
        for log in (checkin.habit_logs or []):
            habit_logs_formatted.append({
                'id': log.id,
                'habit_id': log.habit_id,
                'name': log.name or (log.habit.name if log.habit else 'Habit'),
                'icon': log.habit.icon if log.habit else '✨',
                'streak': log.habit.current_streak if log.habit else 0,
                'completed': log.completed
            })
            
        goals = Goal.query.filter_by(user_id=checkin.user_id).filter(Goal.status.in_(['active', 'completed'])).all()
        goals_formatted = [
            {
                'id': g.id,
                'title': g.title,
                'progress': g.progress,
                'target': g.target,
                'category': g.category,
                'status': g.status
            } for g in goals
        ]

        has_activities = checkin.activities is not None
        has_mood = checkin.mood is not None
        has_wellbeing = checkin.wellbeing is not None
        has_journal = checkin.journal is not None

        return {
            'id': checkin.id,
            'date': checkin.date.isoformat(),
            'is_completed': checkin.is_completed,
            'daily_rating': checkin.daily_rating,
            'life_score': {
                'total_score': ls.score,
                'breakdown': ls.breakdown
            } if ls else None,
            'has_activities': has_activities,
            'activities': {
                'study_hours': checkin.activities.study_hours if has_activities else 0,
                'work_hours': checkin.activities.work_hours if has_activities else 0,
                'exercise_minutes': checkin.activities.exercise_minutes if has_activities else 0,
                'reading_minutes': checkin.activities.reading_minutes if has_activities else 0,
                'meditation_minutes': checkin.activities.meditation_minutes if has_activities else 0,
                'sleep_hours': checkin.activities.sleep_hours if has_activities else 0,
                'water_intake_ml': checkin.activities.water_intake_ml if has_activities else 0,
                'screen_time_minutes': checkin.activities.screen_time_minutes if has_activities else 0,
                'leisure_hours': checkin.activities.leisure_hours if has_activities else 0,
                'walking_steps': checkin.activities.walking_steps if has_activities else 0,
                'calories_burned': checkin.activities.calories_burned if has_activities else 0,
            },
            'has_mood': has_mood,
            'mood': {
                'mood_score': checkin.mood.mood_score if has_mood else 5,
                'intensity': checkin.mood.intensity if has_mood else 3,
                'mood_label': checkin.mood.mood_label if has_mood else '😐',
                'note': checkin.mood.note if has_mood else '',
            },
            'has_wellbeing': has_wellbeing,
            'wellbeing': {
                'energy_level': checkin.wellbeing.energy_level if has_wellbeing else 3,
                'stress_level': checkin.wellbeing.stress_level if has_wellbeing else 3,
                'focus_level': checkin.wellbeing.focus_level if has_wellbeing else 3,
                'motivation_level': checkin.wellbeing.motivation_level if has_wellbeing else 3,
            },
            'has_journal': has_journal,
            'journal': {
                'title': checkin.journal.title if has_journal else '',
                'content': checkin.journal.content if has_journal else '',
            },
            'habit_logs': habit_logs_formatted,
            'goals': goals_formatted
        }
