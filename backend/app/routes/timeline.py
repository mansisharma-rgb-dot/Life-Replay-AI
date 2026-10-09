from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.timeline_service import TimelineService

bp = Blueprint('timeline', __name__, url_prefix='/api/timeline')

@bp.route('/', methods=['GET'])
@jwt_required()
def get_timeline():
    user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    
    result, status = TimelineService.get_user_timeline(user_id, page, per_page)
    return jsonify(result), status
