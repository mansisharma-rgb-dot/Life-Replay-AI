from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from app.schemas.goal_schemas import GoalSchema, GoalUpdateSchema
from app.services.goal_service import GoalService
from app.services.future_goal_service import FutureGoalService

goals_bp = Blueprint('goals', __name__)

@goals_bp.route('/', methods=['GET'])
@jwt_required()
def get_goals():
    current_user_id = get_jwt_identity()
    response_data, status_code = GoalService.get_goals(current_user_id)
    return jsonify(response_data), status_code

@goals_bp.route('/', methods=['POST'])
@jwt_required()
def create_goal():
    current_user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    schema = GoalSchema()
    try:
        validated_data = schema.load(data)
    except ValidationError as err:
        return jsonify({'success': False, 'error': 'Validation failed', 'details': err.messages}), 400
        
    response_data, status_code = GoalService.create_goal(current_user_id, validated_data)
    return jsonify(response_data), status_code

@goals_bp.route('/<int:goal_id>', methods=['GET'])
@jwt_required()
def get_goal(goal_id):
    current_user_id = get_jwt_identity()
    response_data, status_code = GoalService.get_goal(current_user_id, goal_id)
    return jsonify(response_data), status_code

@goals_bp.route('/<int:goal_id>', methods=['PUT', 'PATCH'])
@jwt_required()
def update_goal(goal_id):
    current_user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    schema = GoalUpdateSchema()
    try:
        validated_data = schema.load(data, partial=True)
    except ValidationError as err:
        return jsonify({'success': False, 'error': 'Validation failed', 'details': err.messages}), 400
        
    response_data, status_code = GoalService.update_goal(current_user_id, goal_id, validated_data)
    return jsonify(response_data), status_code

@goals_bp.route('/<int:goal_id>', methods=['DELETE'])
@jwt_required()
def delete_goal(goal_id):
    current_user_id = get_jwt_identity()
    response_data, status_code = GoalService.delete_goal(current_user_id, goal_id)
    return jsonify(response_data), status_code

@goals_bp.route('/predictions', methods=['GET'])
@jwt_required()
def get_goal_predictions():
    current_user_id = get_jwt_identity()
    range_str = request.args.get('range', '30d')
    days = 30
    if range_str == '7d':
        days = 7
    elif range_str == '90d':
        days = 90
    elif range_str == '1y':
        days = 365
    response_data = FutureGoalService.generate_predictions(current_user_id, days)
    return jsonify(response_data), 200
