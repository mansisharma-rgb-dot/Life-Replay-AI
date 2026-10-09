from app.extensions import db

class JournalEntry(db.Model):
    __tablename__ = 'journal_entries'

    id = db.Column(db.Integer, primary_key=True)
    daily_checkin_id = db.Column(db.Integer, db.ForeignKey('daily_checkins.id'), nullable=False, unique=True)
    
    title = db.Column(db.String(255), default='')
    content = db.Column(db.Text, default='')

    # Relationships
    checkin = db.relationship('DailyCheckin', back_populates='journal')
