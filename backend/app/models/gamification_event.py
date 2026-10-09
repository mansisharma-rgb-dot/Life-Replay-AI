from app.extensions import db
from datetime import datetime, timezone

class GamificationEvent(db.Model):
    __tablename__ = 'gamification_events'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    event_type = db.Column(db.String(50), nullable=False) # e.g. 'checkin', 'habit', 'goal', 'achievement', 'journal', 'skill'
    source_id = db.Column(db.String(100), nullable=False) # unique identifier to prevent duplicates, e.g. 'checkin:123'
    xp_amount = db.Column(db.Integer, nullable=False)
    description = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Unique constraint on (user_id, source_id) to prevent duplicate XP for the same event
    __table_args__ = (
        db.UniqueConstraint('user_id', 'source_id', name='uq_user_source_event'),
    )

    # Relationships
    user = db.relationship('User', backref=db.backref('gamification_events', lazy='dynamic', cascade='all, delete-orphan'))
