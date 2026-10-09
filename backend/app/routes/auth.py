from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    jwt_required, 
    get_jwt_identity, 
    set_refresh_cookies, 
    unset_jwt_cookies,
    create_access_token
)
from marshmallow import ValidationError
from app.schemas.auth_schemas import RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema
from app.services.auth_service import AuthService

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    
    # Validate input
    schema = RegisterSchema()
    try:
        validated_data = schema.load(data)
    except ValidationError as err:
        return jsonify({'success': False, 'error': 'Validation failed', 'details': err.messages}), 400
        
    response_data, status_code = AuthService.register_user(validated_data)
    
    refresh_token = response_data.pop('refresh_token', None)
    response = jsonify(response_data)
    
    if status_code == 201 and refresh_token:
        set_refresh_cookies(
            response, 
            refresh_token,
            max_age=current_app.config.get('JWT_REFRESH_TOKEN_EXPIRES', 2592000)
        )
        
    return response, status_code

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    
    schema = LoginSchema()
    try:
        validated_data = schema.load(data)
    except ValidationError as err:
        return jsonify({'success': False, 'error': 'Validation failed', 'details': err.messages}), 400
        
    response_data, status_code = AuthService.login_user(validated_data)
    
    refresh_token = response_data.pop('refresh_token', None)
    response = jsonify(response_data)
    
    if status_code == 200 and refresh_token:
        set_refresh_cookies(
            response, 
            refresh_token,
            max_age=current_app.config.get('JWT_REFRESH_TOKEN_EXPIRES', 2592000)
        )
        
    return response, status_code

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    response = jsonify({'success': True, 'message': 'Successfully logged out.'})
    # Must match setting attributes
    unset_jwt_cookies(response)
    return response, 200

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    new_access_token = create_access_token(identity=current_user_id)
    return jsonify({'success': True, 'access_token': new_access_token}), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    current_user_id = get_jwt_identity()
    response_data, status_code = AuthService.get_current_user(current_user_id)
    return jsonify(response_data), status_code

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    
    schema = ForgotPasswordSchema()
    try:
        validated_data = schema.load(data)
    except ValidationError as err:
        return jsonify({'success': False, 'error': 'Validation failed', 'details': err.messages}), 400
        
    response_data, status_code = AuthService.forgot_password(validated_data)
    return jsonify(response_data), status_code

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    
    schema = ResetPasswordSchema()
    try:
        validated_data = schema.load(data)
    except ValidationError as err:
        return jsonify({'success': False, 'error': 'Validation failed', 'details': err.messages}), 400
        
    if validated_data['password'] != validated_data['confirm_password']:
        return jsonify({'success': False, 'error': 'Passwords do not match.', 'details': {'confirm_password': 'Passwords do not match.'}}), 400
        
    response_data, status_code = AuthService.reset_password(validated_data)
    return jsonify(response_data), status_code
