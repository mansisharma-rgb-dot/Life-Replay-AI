from datetime import date, timedelta
from app.extensions import db
from app.models import Notification, DailyCheckin, Activities, Wellbeing, HabitLog, Habit, Goal, LifeScore
from sqlalchemy import func
from app.services.time_analysis_service import TimeAnalysisService

class SmartNotificationService:
    
    @staticmethod
    def _create_if_not_exists(user_id, identifier, title, message, notif_type, severity, link=None, metadata=None):
        existing = Notification.query.filter_by(user_id=user_id, identifier=identifier).first()
        if existing:
            return None # Prevent duplicate
            
        notif = Notification(
            user_id=user_id,
            identifier=identifier,
            title=title,
            message=message,
            type=notif_type,
            severity=severity,
            link=link,
            metadata_json=metadata
        )
        db.session.add(notif)
        db.session.commit()
        return notif

    @staticmethod
    def check_habit_risk(user_id):
        new_notifications = []
        today = date.today()
        # Look back 7 days
        cutoff = today - timedelta(days=7)
        
        habits = Habit.query.filter_by(user_id=user_id).all()
        
        for h in habits:
            if h.frequency != 'daily':
                continue
                
            # Check completions in last 7 days (excluding today)
            past_logs = db.session.query(func.count(HabitLog.id)).join(DailyCheckin).filter(
                HabitLog.habit_id == h.id,
                DailyCheckin.date >= cutoff,
                DailyCheckin.date < today,
                HabitLog.completed == True
            ).scalar()
            
            # Check if completed today
            completed_today = db.session.query(HabitLog.id).join(DailyCheckin).filter(
                HabitLog.habit_id == h.id,
                DailyCheckin.date == today,
                HabitLog.completed == True
            ).first()
            
            # If habit was consistent (>4 completions in 7 days) but not done today
            if past_logs >= 4 and not completed_today:
                identifier = f"habit_risk:{h.id}:{today.isoformat()}"
                n = SmartNotificationService._create_if_not_exists(
                    user_id=user_id,
                    identifier=identifier,
                    title="Habit streak may be at risk",
                    message=f"Your '{h.name}' habit has been highly consistent recently, but hasn't been logged today.",
                    notif_type="habit_risk",
                    severity="WARNING",
                    link="/habits",
                    metadata={"habit_id": h.id, "past_7_days_count": past_logs}
                )
                if n:
                    new_notifications.append(n)
                    
        return new_notifications

    @staticmethod
    def check_productivity_decline(user_id):
        new_notifications = []
        today = date.today()
        
        # We need at least 14 days of data to establish a baseline
        baseline_analysis = TimeAnalysisService.analyze(user_id, 14)
        if not baseline_analysis or baseline_analysis.get("summary", {}).get("averageProductivityScore", 0) == 0:
            return []
            
        recent_analysis = TimeAnalysisService.analyze(user_id, 3)
        if not recent_analysis or recent_analysis.get("summary", {}).get("averageProductivityScore", 0) == 0:
            return []
            
        baseline_score = baseline_analysis["summary"]["averageProductivityScore"]
        recent_score = recent_analysis["summary"]["averageProductivityScore"]
        
        if baseline_score >= 40 and recent_score < (baseline_score * 0.75):
            # A 25% drop in productivity
            identifier = f"productivity_decline:{today.isoformat()}"
            n = SmartNotificationService._create_if_not_exists(
                user_id=user_id,
                identifier=identifier,
                title="Productivity trending lower",
                message="Your productivity is below your recent personal baseline.",
                notif_type="productivity",
                severity="WARNING",
                link="/time-analysis",
                metadata={"baseline": baseline_score, "recent": recent_score}
            )
            if n:
                new_notifications.append(n)
                
        return new_notifications

    @staticmethod
    def check_focus_decline(user_id):
        new_notifications = []
        today = date.today()
        
        recent_wellbeings = db.session.query(Wellbeing.focus_level).join(DailyCheckin).filter(
            DailyCheckin.user_id == user_id
        ).order_by(DailyCheckin.date.desc()).limit(5).all()
        
        if len(recent_wellbeings) < 5:
            return []
            
        focus_levels = [w[0] for w in recent_wellbeings]
        
        # E.g. [2, 2, 3, 4, 4] means it declined (newest is first in list: index 0 is today)
        if focus_levels[0] <= 2 and focus_levels[1] <= 2 and focus_levels[3] >= 4 and focus_levels[4] >= 4:
            identifier = f"focus_decline:{today.isoformat()}"
            n = SmartNotificationService._create_if_not_exists(
                user_id=user_id,
                identifier=identifier,
                title="Focus levels declining",
                message="Your focus has been trending lower over the last several check-ins.",
                notif_type="focus",
                severity="WARNING",
                link="/analytics",
                metadata={"recent_focus_levels": focus_levels}
            )
            if n:
                new_notifications.append(n)
                
        return new_notifications

    @staticmethod
    def check_sleep_pattern(user_id):
        new_notifications = []
        today = date.today()
        
        recent_activities = db.session.query(Activities.sleep_hours).join(DailyCheckin).filter(
            DailyCheckin.user_id == user_id,
            Activities.sleep_hours > 0
        ).order_by(DailyCheckin.date.desc()).limit(14).all()
        
        if len(recent_activities) < 7:
            return []
            
        sleep_hours = [a[0] for a in recent_activities]
        avg_sleep = sum(sleep_hours) / len(sleep_hours)
        
        recent_sleep = sleep_hours[0]
        
        # Noticeable deviation (less than 75% of baseline or < 5 hours)
        if recent_sleep > 0 and (recent_sleep < avg_sleep * 0.75 or recent_sleep < 5.0) and avg_sleep >= 6.0:
            identifier = f"sleep_pattern:{today.isoformat()}"
            n = SmartNotificationService._create_if_not_exists(
                user_id=user_id,
                identifier=identifier,
                title="Noticeable sleep reduction",
                message="Your recent sleep hours are noticeably below your personal baseline.",
                notif_type="sleep",
                severity="IMPORTANT",
                link="/analytics",
                metadata={"baseline": avg_sleep, "recent": recent_sleep}
            )
            if n:
                new_notifications.append(n)
                
        return new_notifications

    @staticmethod
    def generate_smart_notifications(user_id):
        from app.models import User
        user = User.query.get(user_id)
        if not user or not user.notify_smart_alerts:
            return []

        generated = []
        generated.extend(SmartNotificationService.check_habit_risk(user_id))
        generated.extend(SmartNotificationService.check_productivity_decline(user_id))
        generated.extend(SmartNotificationService.check_focus_decline(user_id))
        generated.extend(SmartNotificationService.check_sleep_pattern(user_id))
        
        # Optional AI Integration here:
        from app.services.llm_service import LLMService
        for notif in generated:
            ai_interpretation = LLMService.interpret_smart_alert(notif)
            if ai_interpretation and isinstance(ai_interpretation, dict):
                if ai_interpretation.get("answer"):
                    notif.message = ai_interpretation["answer"]
                
                meta = dict(notif.metadata_json) if notif.metadata_json else {}
                if "sources" in ai_interpretation:
                    meta["sources"] = ai_interpretation["sources"]
                notif.metadata_json = meta
                
                db.session.commit()
                
        return generated

    @staticmethod
    def get_summary(user_id):
        unread = Notification.query.filter_by(user_id=user_id, is_read=False).all()
        summary = {
            "warnings": sum(1 for n in unread if n.severity == 'WARNING'),
            "important": sum(1 for n in unread if n.severity == 'IMPORTANT'),
            "info": sum(1 for n in unread if n.severity in ['INFO', 'SUCCESS'])
        }
        return summary
