from app.extensions import db
from sqlalchemy import CheckConstraint

class MoodLog(db.Model):
    __tablename__ = 'mood_logs'

    id = db.Column(db.Integer, primary_key=True)
    daily_checkin_id = db.Column(db.Integer, db.ForeignKey('daily_checkins.id'), nullable=False, unique=True)
    
    mood_score = db.Column(db.Integer, default=5)
    intensity = db.Column(db.Integer, default=3)
    mood_label = db.Column(db.String(10), default='😐')
    note = db.Column(db.Text, default='')

    __table_args__ = (
        CheckConstraint('mood_score >= 1 AND mood_score <= 10', name='check_mood_score'),
        CheckConstraint('intensity >= 1 AND intensity <= 5', name='check_mood_intensity'),
    )

    # Relationships
    checkin = db.relationship('DailyCheckin', back_populates='mood')
