from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.gamification_service import GamificationService

gamification_bp = Blueprint('gamification', __name__)

@gamification_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    profile = GamificationService.get_profile(current_user_id)
    if not profile:
        return jsonify({'success': False, 'error': 'User not found'}), 404
        
    return jsonify(profile), 200

@gamification_bp.route('/xp-history', methods=['GET'])
@jwt_required()
def get_xp_history():
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    history = GamificationService.get_history(current_user_id, page=page, per_page=per_page)
    return jsonify(history), 200
