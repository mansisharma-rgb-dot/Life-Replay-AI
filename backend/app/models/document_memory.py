from datetime import datetime, timezone
from app.extensions import db

class DocumentMemory(db.Model):
    __tablename__ = 'document_memories'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    filename = db.Column(db.String(255), nullable=False)
    original_name = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    
    title = db.Column(db.String(255))
    summary = db.Column(db.Text)
    key_topics = db.Column(db.JSON, default=list)
    extracted_text = db.Column(db.Text) # Or a file path if we want to avoid massive DB bloat, but Text is fine for MVP
    
    status = db.Column(db.String(50), default='pending') # pending, processed, error
    error_message = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = db.relationship('User', backref=db.backref('document_memories', lazy=True, cascade='all, delete-orphan'))
