from app.extensions import db
from app.models.notification import Notification

class NotificationService:
    @staticmethod
    def get_user_notifications(user_id):
        return Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).limit(20).all()

    @staticmethod
    def create_notification(user_id, title, message, notif_type="system", link=None):
        n = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=notif_type,
            link=link
        )
        db.session.add(n)
        db.session.commit()
        return n

    @staticmethod
    def mark_as_read(user_id, notification_id):
        n = Notification.query.filter_by(id=notification_id, user_id=user_id).first()
        if n:
            n.is_read = True
            db.session.commit()
            return True
        return False
        
    @staticmethod
    def mark_all_read(user_id):
        Notification.query.filter_by(user_id=user_id, is_read=False).update({Notification.is_read: True})
        db.session.commit()
        return True
