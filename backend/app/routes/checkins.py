from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from app.schemas.checkin_schemas import DailyCheckinSchema
from app.services.daily_checkin_service import DailyCheckinService

checkins_bp = Blueprint('checkins', __name__)

@checkins_bp.route('/today', methods=['GET'])
@jwt_required()
def get_today():
    current_user_id = get_jwt_identity()
    response_data, status_code = DailyCheckinService.get_today(current_user_id)
    return jsonify(response_data), status_code

@checkins_bp.route('/', methods=['POST'])
@jwt_required()
def upsert_checkin():
    current_user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    schema = DailyCheckinSchema()
    try:
        validated_data = schema.load(data)
    except ValidationError as err:
        return jsonify({'success': False, 'error': 'Validation failed', 'details': err.messages}), 400
        
    response_data, status_code = DailyCheckinService.upsert_checkin(current_user_id, validated_data)
    return jsonify(response_data), status_code

@checkins_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    current_user_id = get_jwt_identity()
    
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))
    except ValueError:
        page = 1
        per_page = 50
        
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    period = request.args.get('period')
        
    response_data, status_code = DailyCheckinService.get_history(
        current_user_id, 
        page=page, 
        per_page=per_page,
        start_date=start_date,
        end_date=end_date,
        period=period
    )
    return jsonify(response_data), status_code

@checkins_bp.route('/date/<date_str>', methods=['GET'])
@jwt_required()
def get_by_date(date_str):
    current_user_id = get_jwt_identity()
    response_data, status_code = DailyCheckinService.get_by_date(current_user_id, date_str)
    return jsonify(response_data), status_code
