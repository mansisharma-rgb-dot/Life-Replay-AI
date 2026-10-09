from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from app.schemas.habit_schemas import HabitSchema, HabitUpdateSchema
from app.services.habit_service import HabitService

habits_bp = Blueprint('habits', __name__)

@habits_bp.route('/', methods=['GET'])
@jwt_required()
def get_habits():
    current_user_id = get_jwt_identity()
    response_data, status_code = HabitService.get_habits(current_user_id)
    return jsonify(response_data), status_code

@habits_bp.route('/', methods=['POST'])
@jwt_required()
def create_habit():
    current_user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    schema = HabitSchema()
    try:
        validated_data = schema.load(data)
    except ValidationError as err:
        return jsonify({'success': False, 'error': 'Validation failed', 'details': err.messages}), 400
        
    response_data, status_code = HabitService.create_habit(current_user_id, validated_data)
    return jsonify(response_data), status_code

@habits_bp.route('/<int:habit_id>', methods=['GET'])
@jwt_required()
def get_habit(habit_id):
    current_user_id = get_jwt_identity()
    response_data, status_code = HabitService.get_habit(current_user_id, habit_id)
    return jsonify(response_data), status_code

@habits_bp.route('/<int:habit_id>', methods=['PUT', 'PATCH'])
@jwt_required()
def update_habit(habit_id):
    current_user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    schema = HabitUpdateSchema()
    try:
        validated_data = schema.load(data, partial=True)
    except ValidationError as err:
        return jsonify({'success': False, 'error': 'Validation failed', 'details': err.messages}), 400
        
    response_data, status_code = HabitService.update_habit(current_user_id, habit_id, validated_data)
    return jsonify(response_data), status_code

@habits_bp.route('/<int:habit_id>/history', methods=['GET'])
@jwt_required()
def get_habit_history(habit_id):
    current_user_id = get_jwt_identity()
    response_data, status_code = HabitService.get_habit_history(current_user_id, habit_id)
    return jsonify(response_data), status_code

@habits_bp.route('/<int:habit_id>/completion', methods=['POST'])
@jwt_required()
def record_completion(habit_id):
    current_user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    date_str = data.get('date')
    completed = data.get('completed', True)
    
    from datetime import date
    try:
        if date_str:
            target_date = date.fromisoformat(date_str)
        else:
            target_date = None
    except ValueError:
        return jsonify({'success': False, 'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
    response_data, status_code = HabitService.record_completion(current_user_id, habit_id, target_date, completed)
    return jsonify(response_data), status_code
