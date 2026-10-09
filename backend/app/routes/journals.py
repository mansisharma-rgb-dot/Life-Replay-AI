from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from app.schemas.journal_schemas import JournalEntryUpdateSchema
from app.services.journal_service import JournalService

journals_bp = Blueprint('journals', __name__)

@journals_bp.route('/', methods=['GET'])
@jwt_required()
def get_journals():
    current_user_id = get_jwt_identity()
    
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
    except ValueError:
        page = 1
        per_page = 20
        
    response_data, status_code = JournalService.get_journals(current_user_id, page=page, per_page=per_page)
    return jsonify(response_data), status_code

@journals_bp.route('/<int:journal_id>', methods=['GET'])
@jwt_required()
def get_journal(journal_id):
    current_user_id = get_jwt_identity()
    response_data, status_code = JournalService.get_journal(current_user_id, journal_id)
    return jsonify(response_data), status_code

@journals_bp.route('/<int:journal_id>', methods=['PUT', 'PATCH'])
@jwt_required()
def update_journal(journal_id):
    current_user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    schema = JournalEntryUpdateSchema()
    try:
        validated_data = schema.load(data, partial=True)
    except ValidationError as err:
        return jsonify({'success': False, 'error': 'Validation failed', 'details': err.messages}), 400
        
    response_data, status_code = JournalService.update_journal(current_user_id, journal_id, validated_data)
    return jsonify(response_data), status_code
