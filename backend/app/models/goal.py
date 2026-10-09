from app.extensions import db
from datetime import datetime, timezone

class Goal(db.Model):
    __tablename__ = 'goals'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    title = db.Column(db.String(255), nullable=False)
    progress = db.Column(db.Float, default=0.0)
    target = db.Column(db.Float, default=100.0)
    category = db.Column(db.String(50))
    deadline = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(50), default='active')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = db.relationship('User', back_populates='goals')
