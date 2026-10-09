from app.extensions import db
from datetime import date, datetime, timezone
from sqlalchemy import CheckConstraint
import json

class LifeScore(db.Model):
    __tablename__ = 'life_scores'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, nullable=False, default=date.today)
    
    score = db.Column(db.Integer, nullable=False)
    
    # Store breakdown dynamically as JSON string or JSON column
    # SQLite supports JSON, but typically as a String if not using JSON type explicitly
    breakdown = db.Column(db.JSON, nullable=True)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        CheckConstraint('score >= 0 AND score <= 100', name='check_life_score_range'),
        db.UniqueConstraint('user_id', 'date', name='uq_user_date_lifescore'),
    )

    # Relationships
    user = db.relationship('User', back_populates='life_scores')
