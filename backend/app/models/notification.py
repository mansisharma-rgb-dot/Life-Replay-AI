from datetime import datetime, timezone
from app.extensions import db

class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    title = db.Column(db.String(100), nullable=False)
    message = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(50)) # e.g. 'achievement', 'goal', 'system', 'habit_risk'
    is_read = db.Column(db.Boolean, default=False)
    link = db.Column(db.String(255)) # optional route to navigate to
    
    # Phase 19 extensions
    severity = db.Column(db.String(20), default='INFO') # INFO, SUCCESS, WARNING, IMPORTANT
    identifier = db.Column(db.String(255), nullable=True) # deterministic unique key per user to prevent duplicates
    metadata_json = db.Column(db.JSON, nullable=True) # JSON structured evidence and contextual IDs
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = db.relationship('User', back_populates='notifications')
