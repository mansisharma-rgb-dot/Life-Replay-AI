from app.extensions import db
from app.models import User
from flask_jwt_extended import create_access_token, create_refresh_token
from html import escape
from datetime import datetime, timedelta

# Simple dictionary for simulating reset tokens in dev
# In production, this should be stored in DB or Redis
reset_tokens = {}

class AuthService:
    @staticmethod
    def register_user(data):
        email = data.get('email', '').lower()
        
        # Check if email exists
        if User.query.filter_by(email=email).first():
            return {'success': False, 'error': 'Email is already registered.', 'details': {'email': 'Already taken'}}, 409
            
        new_user = User(
            full_name=data['full_name'],
            email=email
        )
        new_user.set_password(data['password'])
        
        db.session.add(new_user)
        db.session.commit()
        
        # Optionally log them in immediately, but frontend doesn't strictly require it if it handles the redirect
        access_token = create_access_token(identity=str(new_user.id))
        refresh_token = create_refresh_token(identity=str(new_user.id))
        
        return {
            'success': True,
            'message': 'Registration successful',
            'user': {
                'id': new_user.id,
                'full_name': new_user.full_name,
                'email': new_user.email
            },
            'access_token': access_token,
            'refresh_token': refresh_token
        }, 201

    @staticmethod
    def login_user(data):
        email = data.get('email', '').lower()
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.check_password(data.get('password', '')):
            return {'success': False, 'error': 'Invalid email or password.'}, 401
            
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        return {
            'success': True,
            'user': {
                'id': user.id,
                'full_name': user.full_name,
                'email': user.email
            },
            'access_token': access_token,
            'refresh_token': refresh_token
        }, 200

    @staticmethod
    def forgot_password(data):
        email = data.get('email', '').lower()
        user = User.query.filter_by(email=email).first()
        
        # We don't want to expose whether user exists, always return success message
        if user:
            from itsdangerous import URLSafeTimedSerializer
            from flask import current_app
            from app.services.email_service import EmailService
            
            serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
            token = serializer.dumps({'user_id': user.id, 'email': user.email}, salt='password-reset-salt')
            
            reset_tokens[token] = {
                'user_id': user.id,
                'expires': datetime.now() + timedelta(hours=1)
            }
            
            frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5173').rstrip('/')
            reset_url = f"{frontend_url}/reset-password/{token}"
            
            EmailService.send_password_reset_email(
                to_email=user.email,
                user_name=user.full_name,
                reset_url=reset_url
            )

        return {'success': True, 'message': 'If an account with that email exists, we have sent a reset link.'}, 200

    @staticmethod
    def reset_password(data):
        token = data.get('token')
        if not token:
            return {'success': False, 'error': 'Reset token is required.'}, 400
            
        user_id = None
        # Check in-memory store first (handles test overrides & invalidation)
        if token in reset_tokens:
            token_data = reset_tokens[token]
            if token_data['expires'] < datetime.now():
                del reset_tokens[token]
                return {'success': False, 'error': 'Token expired.'}, 400
            user_id = token_data['user_id']
        else:
            # First verify tamper-proof signed token
            try:
                from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
                from flask import current_app
                secret_key = current_app.config.get('SECRET_KEY', 'dev_secret_key')
                serializer = URLSafeTimedSerializer(secret_key)
                token_payload = serializer.loads(token, salt='password-reset-salt', max_age=3600)
                user_id = token_payload.get('user_id')
            except SignatureExpired:
                return {'success': False, 'error': 'Token expired.'}, 400
            except Exception as err:
                print(f"[AUTH DIAGNOSTIC] Token verification exception: {type(err).__name__}: {err}", flush=True)

        if not user_id:
            return {'success': False, 'error': 'Invalid or expired reset token.'}, 400
            
        user = User.query.get(user_id)
        if not user:
            return {'success': False, 'error': 'User not found.'}, 404
            
        user.set_password(data['password'])
        db.session.commit()
        
        # Invalidate the token if present in in-memory store
        if token in reset_tokens:
            del reset_tokens[token]
            
        return {'success': True, 'message': 'Password has been reset successfully.'}, 200

    @staticmethod
    def get_current_user(user_id):
        user = User.query.get(user_id)
        if not user:
            return {'success': False, 'error': 'User not found.'}, 404
            
        return {
            'success': True,
            'user': {
                'id': user.id,
                'full_name': user.full_name,
                'email': user.email,
                'current_streak': user.current_streak,
                'longest_streak': user.longest_streak,
                'total_xp': user.total_xp,
                'level': user.level
            }
        }, 200
