from app.extensions import db

class Activities(db.Model):
    __tablename__ = 'activities'

    id = db.Column(db.Integer, primary_key=True)
    daily_checkin_id = db.Column(db.Integer, db.ForeignKey('daily_checkins.id'), nullable=False, unique=True)
    
    study_hours = db.Column(db.Float, default=0.0)
    work_hours = db.Column(db.Float, default=0.0)
    exercise_minutes = db.Column(db.Integer, default=0)
    reading_minutes = db.Column(db.Integer, default=0)
    meditation_minutes = db.Column(db.Integer, default=0)
    sleep_hours = db.Column(db.Float, default=0.0)
    water_intake_ml = db.Column(db.Integer, default=0)
    screen_time_minutes = db.Column(db.Integer, default=0)
    leisure_hours = db.Column(db.Float, default=0.0)
    walking_steps = db.Column(db.Integer, default=0)
    calories_burned = db.Column(db.Integer, default=0)

    # Relationships
    checkin = db.relationship('DailyCheckin', back_populates='activities')
