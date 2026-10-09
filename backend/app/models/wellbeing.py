from app.extensions import db
from sqlalchemy import CheckConstraint

class Wellbeing(db.Model):
    __tablename__ = 'wellbeings'

    id = db.Column(db.Integer, primary_key=True)
    daily_checkin_id = db.Column(db.Integer, db.ForeignKey('daily_checkins.id'), nullable=False, unique=True)
    
    energy_level = db.Column(db.Integer, default=3)
    stress_level = db.Column(db.Integer, default=3)
    focus_level = db.Column(db.Integer, default=3)
    motivation_level = db.Column(db.Integer, default=3)

    __table_args__ = (
        CheckConstraint('energy_level >= 1 AND energy_level <= 5', name='check_energy_level'),
        CheckConstraint('stress_level >= 1 AND stress_level <= 5', name='check_stress_level'),
        CheckConstraint('focus_level >= 1 AND focus_level <= 5', name='check_focus_level'),
        CheckConstraint('motivation_level >= 1 AND motivation_level <= 5', name='check_motivation_level'),
    )

    # Relationships
    checkin = db.relationship('DailyCheckin', back_populates='wellbeing')
