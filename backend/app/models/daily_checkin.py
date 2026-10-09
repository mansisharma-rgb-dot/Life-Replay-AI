from datetime import datetime, timezone, date
from app.extensions import db
from sqlalchemy import UniqueConstraint

class DailyCheckin(db.Model):
    __tablename__ = 'daily_checkins'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, nullable=False, default=date.today)
    daily_rating = db.Column(db.Integer, default=0)
    is_completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint('user_id', 'date', name='uq_user_date_checkin'),
    )

    # Relationships
    user = db.relationship('User', back_populates='checkins')
    activities = db.relationship('Activities', back_populates='checkin', uselist=False, cascade='all, delete-orphan')
    mood = db.relationship('MoodLog', back_populates='checkin', uselist=False, cascade='all, delete-orphan')
    wellbeing = db.relationship('Wellbeing', back_populates='checkin', uselist=False, cascade='all, delete-orphan')
    journal = db.relationship('JournalEntry', back_populates='checkin', uselist=False, cascade='all, delete-orphan')
    habit_logs = db.relationship('HabitLog', back_populates='checkin', cascade='all, delete-orphan')
