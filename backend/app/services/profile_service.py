from app.extensions import db
from app.models import User, Goal, Habit, JournalEntry, DailyCheckin, Achievement, Skill, Notification, GamificationEvent, DocumentMemory, LifeScore
from werkzeug.security import check_password_hash

class ProfileService:
    @staticmethod
    def get_profile(user_id):
        user_id = int(user_id)
        user = db.session.get(User, user_id)
        if not user:
            return {'success': False, 'error': 'User not found'}, 404
            
        return {
            'success': True,
            'profile': {
                'id': user.id,
                'full_name': user.full_name,
                'email': user.email,
                'bio': user.bio,
                'timezone': user.timezone or 'UTC',
                'preferred_language': user.preferred_language or 'en',
                'date_format': getattr(user, 'date_format', 'YYYY-MM-DD') or 'YYYY-MM-DD',
                'time_format': getattr(user, 'time_format', '12h') or '12h',
                'has_avatar': bool(user.avatar_filename),
                'created_at': user.created_at.isoformat() if user.created_at else None,
                
                # Gamification
                'level': user.level or 1,
                'total_xp': user.total_xp or 0,
                'current_streak': user.current_streak or 0,
                'longest_streak': user.longest_streak or 0,
                
                # AI Preferences
                'ai_style': user.ai_style or 'Balanced',
                'ai_coaching': user.ai_coaching or 'Neutral',
                'ai_focus_areas': user.ai_focus_areas or '',
                
                # Privacy
                'privacy_analyze_documents': user.privacy_analyze_documents if user.privacy_analyze_documents is not None else True,
                'privacy_analyze_journals': user.privacy_analyze_journals if user.privacy_analyze_journals is not None else True,
                'privacy_enable_analytics': user.privacy_enable_analytics if user.privacy_enable_analytics is not None else True,
                
                # Notifications
                'notify_smart_alerts': user.notify_smart_alerts if user.notify_smart_alerts is not None else True,
                'notify_habit_reminders': user.notify_habit_reminders if user.notify_habit_reminders is not None else True,
                'notify_goal_reminders': user.notify_goal_reminders if user.notify_goal_reminders is not None else True,
                'notify_achievements': user.notify_achievements if user.notify_achievements is not None else True,
                'notify_monthly_reports': user.notify_monthly_reports if user.notify_monthly_reports is not None else True,
            }
        }, 200

    @staticmethod
    def update_profile(user_id, data):
        user_id = int(user_id)
        user = db.session.get(User, user_id)
        if not user:
            return {'success': False, 'error': 'User not found'}, 404
            
        # Allowed fields for update
        allowed_fields = [
            'full_name', 'bio', 'timezone', 'preferred_language', 'date_format', 'time_format',
            'ai_style', 'ai_coaching', 'ai_focus_areas',
            'privacy_analyze_documents', 'privacy_analyze_journals', 'privacy_enable_analytics',
            'notify_smart_alerts', 'notify_habit_reminders', 'notify_goal_reminders',
            'notify_achievements', 'notify_monthly_reports'
        ]
        
        for field in allowed_fields:
            if field in data and hasattr(user, field):
                setattr(user, field, data[field])
                
        db.session.commit()
        return ProfileService.get_profile(user_id)

    @staticmethod
    def get_journey_stats(user_id):
        user_id = int(user_id)
        user = db.session.get(User, user_id)
        if not user:
            return {'success': False, 'error': 'User not found'}, 404
            
        from sqlalchemy import func
        
        total_checkins = DailyCheckin.query.filter_by(user_id=user_id, is_completed=True).count()
        total_journals = JournalEntry.query.join(DailyCheckin).filter(DailyCheckin.user_id == user_id).count()
        goals_completed = Goal.query.filter_by(user_id=user_id, status='completed').count()
        goals_active = Goal.query.filter_by(user_id=user_id, status='active').count()
        habits_count = Habit.query.filter_by(user_id=user_id).count()
        achievements_count = Achievement.query.filter_by(user_id=user_id).count()
        
        latest_ls = LifeScore.query.filter_by(user_id=user_id).order_by(LifeScore.date.desc()).first()
        latest_life_score = latest_ls.score if latest_ls else None
        
        return {
            'success': True,
            'stats': {
                'total_checkins': total_checkins,
                'current_streak': user.current_streak or 0,
                'longest_streak': user.longest_streak or 0,
                'goals_completed': goals_completed,
                'goals_active': goals_active,
                'habits_tracked': habits_count,
                'journal_entries': total_journals,
                'achievements_unlocked': achievements_count,
                'total_xp': user.total_xp or 0,
                'level': user.level or 1,
                'life_score': latest_life_score
            }
        }, 200

    @staticmethod
    def export_user_data(user_id):
        user_id = int(user_id)
        user = db.session.get(User, user_id)
        if not user:
            return {'success': False, 'error': 'User not found'}, 404
            
        profile_data = {
            'id': user.id,
            'full_name': user.full_name,
            'email': user.email,
            'bio': user.bio,
            'timezone': user.timezone,
            'preferred_language': user.preferred_language,
            'level': user.level,
            'total_xp': user.total_xp,
            'current_streak': user.current_streak,
            'longest_streak': user.longest_streak,
            'created_at': user.created_at.isoformat() if user.created_at else None
        }
        
        checkins_data = []
        for c in user.checkins:
            checkins_data.append({
                'date': c.date.isoformat(),
                'daily_rating': c.daily_rating,
                'is_completed': c.is_completed,
                'study_hours': c.activities.study_hours if c.activities else 0,
                'work_hours': c.activities.work_hours if c.activities else 0,
                'sleep_hours': c.activities.sleep_hours if c.activities else 0,
                'mood_score': c.mood.mood_score if c.mood else None,
                'mood_label': c.mood.mood_label if c.mood else None,
                'journal_title': c.journal.title if c.journal else None,
                'journal_content': c.journal.content if c.journal else None
            })
            
        goals_data = [{'title': g.title, 'category': g.category, 'target': g.target, 'progress': g.progress, 'status': g.status} for g in user.goals]
        habits_data = [{'name': h.name, 'frequency': h.frequency, 'icon': h.icon, 'status': h.status} for h in user.habits]
        achievements_data = [{'name': a.name, 'description': a.description, 'icon': a.icon, 'unlocked_at': a.unlocked_at.isoformat() if a.unlocked_at else None} for a in user.achievements]
        
        from datetime import datetime
        return {
            'success': True,
            'export_date': datetime.now().isoformat(),
            'user': profile_data,
            'checkins': checkins_data,
            'goals': goals_data,
            'habits': habits_data,
            'achievements': achievements_data
        }, 200

    @staticmethod
    def upload_avatar(user_id, file):
        import os
        import uuid
        from werkzeug.utils import secure_filename
        from flask import current_app
        
        user_id = int(user_id)
        user = db.session.get(User, user_id)
        if not user:
            return {'success': False, 'error': 'User not found'}, 404
            
        if not file:
            return {'success': False, 'error': 'No file provided'}, 400
            
        filename = secure_filename(file.filename)
        ext = os.path.splitext(filename)[1].lower()
        if ext not in ['.jpg', '.jpeg', '.png', '.webp']:
            return {'success': False, 'error': 'Invalid file type. Only JPG, PNG, and WEBP are allowed.'}, 400
            
        # Ensure avatar directory exists
        avatar_dir = os.path.join(current_app.instance_path, 'avatars')
        os.makedirs(avatar_dir, exist_ok=True)
        
        # Remove old avatar if exists
        if user.avatar_filename:
            old_path = os.path.join(avatar_dir, user.avatar_filename)
            if os.path.exists(old_path):
                try:
                    os.remove(old_path)
                except OSError:
                    pass
                    
        # Save new avatar
        new_filename = f"user_{user_id}_{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(avatar_dir, new_filename)
        file.save(file_path)
        
        user.avatar_filename = new_filename
        db.session.commit()
        
        return ProfileService.get_profile(user_id)

    @staticmethod
    def get_avatar(user_id):
        import os
        from flask import current_app, send_file
        
        user_id = int(user_id)
        user = db.session.get(User, user_id)
        if not user or not user.avatar_filename:
            return {'success': False, 'error': 'Avatar not found'}, 404
            
        avatar_dir = os.path.join(current_app.instance_path, 'avatars')
        file_path = os.path.join(avatar_dir, user.avatar_filename)
        
        if not os.path.exists(file_path):
            return {'success': False, 'error': 'Avatar file missing'}, 404
            
        return send_file(file_path)

    @staticmethod
    def remove_avatar(user_id):
        import os
        from flask import current_app
        
        user_id = int(user_id)
        user = db.session.get(User, user_id)
        if not user:
            return {'success': False, 'error': 'User not found'}, 404
            
        if user.avatar_filename:
            avatar_dir = os.path.join(current_app.instance_path, 'avatars')
            file_path = os.path.join(avatar_dir, user.avatar_filename)
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except OSError:
                    pass
            user.avatar_filename = None
            db.session.commit()
            
        return ProfileService.get_profile(user_id)

    @staticmethod
    def change_password(user_id, data):
        user_id = int(user_id)
        user = db.session.get(User, user_id)
        if not user:
            return {'success': False, 'error': 'User not found'}, 404
            
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return {'success': False, 'error': 'Both current and new passwords are required'}, 400
            
        if not user.check_password(current_password):
            return {'success': False, 'error': 'Incorrect current password'}, 401
            
        if len(new_password) < 8:
            return {'success': False, 'error': 'New password must be at least 8 characters long'}, 400
            
        user.set_password(new_password)
        db.session.commit()
        
        return {'success': True, 'message': 'Password changed successfully'}, 200

    @staticmethod
    def delete_account(user_id):
        user_id = int(user_id)
        user = db.session.get(User, user_id)
        if not user:
            return {'success': False, 'error': 'User not found'}, 404
            
        db.session.delete(user)
        db.session.commit()
        
        return {'success': True, 'message': 'Account deleted successfully'}, 200
