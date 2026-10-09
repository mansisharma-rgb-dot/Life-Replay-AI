from app.extensions import db
from app.models import JournalEntry, DailyCheckin

class JournalService:
    @staticmethod
    def get_journals(user_id, page=1, per_page=20):
        from sqlalchemy.orm import joinedload
        pagination = JournalEntry.query.join(DailyCheckin).filter(
            DailyCheckin.user_id == user_id
        ).options(
            joinedload(JournalEntry.checkin)
        ).order_by(DailyCheckin.date.desc()).paginate(page=page, per_page=per_page, error_out=False)
            
        items = [JournalService._format_journal(j) for j in pagination.items]
        
        return {
            'items': items,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }, 200

    @staticmethod
    def get_journal(user_id, journal_id):
        journal = JournalEntry.query.filter_by(id=journal_id).first()
        if not journal or not journal.checkin or journal.checkin.user_id != int(user_id):
            return {'success': False, 'error': 'Journal entry not found'}, 404
            
        return JournalService._format_journal(journal), 200

    @staticmethod
    def update_journal(user_id, journal_id, data):
        journal = JournalEntry.query.filter_by(id=journal_id).first()
        if not journal or not journal.checkin or journal.checkin.user_id != int(user_id):
            return {'success': False, 'error': 'Journal entry not found'}, 404
            
        if 'title' in data:
            journal.title = data['title']
        if 'content' in data:
            journal.content = data['content']
            
        db.session.commit()
        
        if journal.content and len(journal.content.strip()) > 10:
            from app.services.gamification_service import GamificationService
            GamificationService.award_xp(user_id, "journal", f"journal:{journal.id}", 10, "Journal Entry Updated")
            
        return JournalService._format_journal(journal), 200

    @staticmethod
    def _format_journal(journal):
        return {
            'id': journal.id,
            'daily_checkin_id': journal.daily_checkin_id,
            'date': journal.checkin.date.isoformat() if journal.checkin else None,
            'title': journal.title,
            'content': journal.content
        }
