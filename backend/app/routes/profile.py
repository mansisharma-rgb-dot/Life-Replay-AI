from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.profile_service import ProfileService

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    result, status = ProfileService.get_profile(user_id)
    return jsonify(result), status

@profile_bp.route('/', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    result, status = ProfileService.update_profile(user_id, data)
    return jsonify(result), status

@profile_bp.route('/password', methods=['PUT'])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    result, status = ProfileService.change_password(user_id, data)
    return jsonify(result), status

@profile_bp.route('/', methods=['DELETE'])
@jwt_required()
def delete_account():
    user_id = get_jwt_identity()
    result, status = ProfileService.delete_account(user_id)
    return jsonify(result), status

@profile_bp.route('/avatar', methods=['POST'])
@jwt_required()
def upload_avatar():
    user_id = get_jwt_identity()
    if 'avatar' not in request.files:
        return jsonify({'success': False, 'error': 'No file part'}), 400
    file = request.files['avatar']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No selected file'}), 400
    result, status = ProfileService.upload_avatar(user_id, file)
    return jsonify(result), status

@profile_bp.route('/avatar', methods=['GET'])
@jwt_required()
def get_avatar():
    user_id = get_jwt_identity()
    return ProfileService.get_avatar(user_id)

@profile_bp.route('/avatar', methods=['DELETE'])
@jwt_required()
def remove_avatar():
    user_id = get_jwt_identity()
    result, status = ProfileService.remove_avatar(user_id)
    return jsonify(result), status

@profile_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_journey_stats():
    user_id = get_jwt_identity()
    result, status = ProfileService.get_journey_stats(user_id)
    return jsonify(result), status

@profile_bp.route('/export', methods=['GET'])
@jwt_required()
def export_user_data():
    user_id = get_jwt_identity()
    result, status = ProfileService.export_user_data(user_id)
    return jsonify(result), status
