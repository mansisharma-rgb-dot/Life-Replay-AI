from app.extensions import db

class HabitLog(db.Model):
    __tablename__ = 'habit_logs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    daily_checkin_id = db.Column(db.Integer, db.ForeignKey('daily_checkins.id'), nullable=False)
    
    name = db.Column(db.String(100), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    habit_id = db.Column(db.Integer, db.ForeignKey('habits.id'), nullable=True)

    # Relationships
    user = db.relationship('User', back_populates='habit_logs')
    checkin = db.relationship('DailyCheckin', back_populates='habit_logs')
    habit = db.relationship('Habit', back_populates='logs')
