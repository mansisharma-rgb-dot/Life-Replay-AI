import math
from datetime import datetime, timezone
from app.extensions import db
from app.models import GamificationEvent, User, Notification
from sqlalchemy.exc import IntegrityError
from sqlalchemy import desc

class GamificationService:
    @staticmethod
    def calculate_level(total_xp):
        """
        Deterministic level calculation.
        Uses the formula: XP_req(level) = 25 * level^2 + 25 * level - 50
        Level 1: 0 XP
        Level 2: 100 XP
        Level 3: 250 XP
        Level 4: 450 XP
        Level 5: 700 XP
        """
        if total_xp < 0:
            total_xp = 0
            
        level = 1
        while True:
            # XP required to REACH the next level
            next_level_req = 25 * (level + 1)**2 + 25 * (level + 1) - 50
            if total_xp >= next_level_req:
                level += 1
            else:
                break
                
        current_level_req = 25 * level**2 + 25 * level - 50 if level > 1 else 0
        next_level_req = 25 * (level + 1)**2 + 25 * (level + 1) - 50
        
        current_level_xp = total_xp - current_level_req
        xp_needed = next_level_req - current_level_req
        progress_percent = round((current_level_xp / xp_needed) * 100, 1) if xp_needed > 0 else 100.0
        
        return {
            "total_xp": total_xp,
            "level": level,
            "current_level_xp": current_level_xp,
            "next_level_xp": next_level_req,
            "progress_percent": progress_percent
        }

    @staticmethod
    def award_xp(user_id, event_type, source_id, xp_amount, description):
        """
        Safely award XP for an action, preventing duplicates.
        Returns: (success, awarded_xp, level_up_info)
        """
        # Create event
        event = GamificationEvent(
            user_id=user_id,
            event_type=event_type,
            source_id=source_id,
            xp_amount=xp_amount,
            description=description
        )
        
        try:
            db.session.add(event)
            db.session.flush() # Try to push to DB to catch unique constraint violation
        except IntegrityError:
            db.session.rollback()
            return False, 0, None # Duplicate event
            
        # Update user total XP
        user = db.session.query(User).get(user_id)
        if not user:
            db.session.rollback()
            return False, 0, None
            
        old_level = GamificationService.calculate_level(user.total_xp)["level"]
        user.total_xp += xp_amount
        new_level_info = GamificationService.calculate_level(user.total_xp)
        new_level = new_level_info["level"]
        
        user.level = new_level
        
        level_up_info = None
        if new_level > old_level:
            level_up_info = {
                "old_level": old_level,
                "new_level": new_level
            }
            
            # Create a notification for level up
            notif = Notification(
                user_id=user_id,
                title="Level Up!",
                message=f"You reached Level {new_level}! Keep up the great work.",
                type="level_up",
                severity="info",
                metadata_json={"level": new_level, "xp_awarded": xp_amount}
            )
            db.session.add(notif)
            
        db.session.commit()
        return True, xp_amount, level_up_info

    @staticmethod
    def get_profile(user_id):
        user = db.session.query(User).get(user_id)
        if not user:
            return None
            
        level_info = GamificationService.calculate_level(user.total_xp)
        
        recent_events = db.session.query(GamificationEvent)\
            .filter_by(user_id=user_id)\
            .order_by(desc(GamificationEvent.created_at))\
            .limit(5)\
            .all()
            
        return {
            "total_xp": user.total_xp,
            "level": level_info["level"],
            "current_level_xp": level_info["current_level_xp"],
            "next_level_xp": level_info["next_level_xp"],
            "progress_percent": level_info["progress_percent"],
            "current_streak": user.current_streak,
            "longest_streak": user.longest_streak,
            "recent_rewards": [
                {
                    "event_type": e.event_type,
                    "xp_amount": e.xp_amount,
                    "description": e.description,
                    "created_at": e.created_at.isoformat()
                } for e in recent_events
            ]
        }

    @staticmethod
    def get_history(user_id, page=1, per_page=20):
        pagination = db.session.query(GamificationEvent)\
            .filter_by(user_id=user_id)\
            .order_by(desc(GamificationEvent.created_at))\
            .paginate(page=page, per_page=per_page, error_out=False)
            
        return {
            "items": [
                {
                    "id": e.id,
                    "event_type": e.event_type,
                    "xp_amount": e.xp_amount,
                    "description": e.description,
                    "created_at": e.created_at.isoformat()
                } for e in pagination.items
            ],
            "total": pagination.total,
            "page": page,
            "pages": pagination.pages
        }
