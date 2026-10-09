from datetime import datetime, timezone
from app.extensions import db

class Habit(db.Model):
    __tablename__ = 'habits'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    name = db.Column(db.String(100), nullable=False)
    icon = db.Column(db.String(50), default='✨')
    frequency = db.Column(db.String(50), default='daily')
    status = db.Column(db.String(50), default='active')
    
    current_streak = db.Column(db.Integer, default=0)
    longest_streak = db.Column(db.Integer, default=0)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = db.relationship('User', back_populates='habits')
    logs = db.relationship('HabitLog', back_populates='habit', cascade='all, delete-orphan')
