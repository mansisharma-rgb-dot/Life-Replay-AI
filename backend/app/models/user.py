from datetime import datetime, timezone
from app.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    
    current_streak = db.Column(db.Integer, default=0)
    longest_streak = db.Column(db.Integer, default=0)
    total_xp = db.Column(db.Integer, default=0)
    level = db.Column(db.Integer, default=1)
    
    # Personal Information
    bio = db.Column(db.Text, nullable=True)
    timezone = db.Column(db.String(50), default='UTC')
    preferred_language = db.Column(db.String(10), default='en')
    date_format = db.Column(db.String(20), default='YYYY-MM-DD')
    time_format = db.Column(db.String(10), default='12h')
    avatar_filename = db.Column(db.String(255), nullable=True)
    
    # AI Personalization
    ai_style = db.Column(db.String(50), default='Balanced') # Concise, Balanced, Detailed
    ai_coaching = db.Column(db.String(50), default='Neutral') # Gentle, Neutral, Motivational, Direct
    ai_focus_areas = db.Column(db.Text, nullable=True) # JSON array or comma separated string
    
    # Privacy Controls
    privacy_analyze_documents = db.Column(db.Boolean, default=True)
    privacy_analyze_journals = db.Column(db.Boolean, default=True)
    privacy_enable_analytics = db.Column(db.Boolean, default=True)
    
    # Notification Preferences
    notify_smart_alerts = db.Column(db.Boolean, default=True)
    notify_habit_reminders = db.Column(db.Boolean, default=True)
    notify_goal_reminders = db.Column(db.Boolean, default=True)
    notify_achievements = db.Column(db.Boolean, default=True)
    notify_monthly_reports = db.Column(db.Boolean, default=True)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    checkins = db.relationship('DailyCheckin', back_populates='user', cascade='all, delete-orphan')
    goals = db.relationship('Goal', back_populates='user', cascade='all, delete-orphan')
    achievements = db.relationship('Achievement', back_populates='user', cascade='all, delete-orphan')
    habits = db.relationship('Habit', back_populates='user', cascade='all, delete-orphan')
    habit_logs = db.relationship('HabitLog', back_populates='user', cascade='all, delete-orphan')
    life_scores = db.relationship('LifeScore', back_populates='user', cascade='all, delete-orphan')
    skills = db.relationship('Skill', back_populates='user', cascade='all, delete-orphan')
    notifications = db.relationship('Notification', back_populates='user', cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
