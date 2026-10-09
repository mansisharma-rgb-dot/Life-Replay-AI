from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.achievement_service import AchievementService

achievements_bp = Blueprint('achievements', __name__)

@achievements_bp.route('/', methods=['GET'])
@jwt_required()
def get_achievements():
    user_id = get_jwt_identity()
    achievements = AchievementService.get_user_achievements(user_id)
    return jsonify({"success": True, "achievements": achievements}), 200
