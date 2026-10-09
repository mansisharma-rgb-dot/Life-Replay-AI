from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.search_service import SearchService

search_bp = Blueprint('search', __name__)

@search_bp.route('/', methods=['GET'])
@jwt_required()
def perform_search():
    user_id = get_jwt_identity()
    query = request.args.get('q', '').strip()
    
    results = SearchService.search(user_id, query)
    return jsonify({"success": True, "results": results}), 200
