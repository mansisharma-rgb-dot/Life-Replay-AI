import os
from flask import Flask, request, jsonify
from app.config import config
from app.extensions import db, migrate, jwt, cors, ma

def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'default')

    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config[config_name])

    # Ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}}, supports_credentials=app.config.get('CORS_SUPPORTS_CREDENTIALS', False))
    ma.init_app(app)

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.checkins import checkins_bp
    from app.routes.analytics import analytics_bp
    from app.routes.ai import ai_bp
    from .routes.goals import goals_bp
    from .routes.habits import habits_bp
    from .routes.journals import journals_bp
    from .routes.skills import skills_bp
    from .routes.achievements import achievements_bp
    from .routes.search import search_bp
    from .routes.notifications import notifications_bp
    from .routes.timeline import bp as timeline_bp
    from .routes.documents import documents_bp
    from .routes.reports import reports_bp
    from .routes.gamification import gamification_bp
    from .routes.profile import profile_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(checkins_bp, url_prefix='/api/checkins')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(goals_bp, url_prefix='/api/goals')
    app.register_blueprint(habits_bp, url_prefix='/api/habits')
    app.register_blueprint(journals_bp, url_prefix='/api/journals')
    app.register_blueprint(skills_bp, url_prefix='/api/skills')
    app.register_blueprint(achievements_bp, url_prefix='/api/achievements')
    app.register_blueprint(search_bp, url_prefix='/api/search')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(timeline_bp)
    app.register_blueprint(documents_bp, url_prefix='/api/documents')
    app.register_blueprint(reports_bp)
    app.register_blueprint(gamification_bp, url_prefix='/api/gamification')
    app.register_blueprint(profile_bp, url_prefix='/api/profile')
    
    @app.route('/api/health')
    def health_check():
        return jsonify({"status": "ok"})
        
    @app.route('/api/health/ai')
    def ai_health_check():
        api_key = os.environ.get('OPENAI_API_KEY')
        return jsonify({
            "openai_configured": bool(api_key and api_key.strip())
        })
    # Import models so SQLAlchemy knows about them
    from app import models

    @app.errorhandler(Exception)
    def handle_global_error(e):
        from werkzeug.exceptions import HTTPException
        if isinstance(e, HTTPException):
            return e
            
        app.logger.error(f"Unhandled Exception: {str(e)}")
        # If in debug mode, Flask handles this, but we force JSON if API route
        # For production, we don't leak stack traces
        from flask import request, jsonify
        if request.path.startswith('/api/'):
            return jsonify({
                "success": False,
                "error": "Internal Server Error"
            }), 500
        return "Internal Server Error", 500

    @app.after_request
    def add_security_headers(response):
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        # Prevent caching of API responses unless explicitly requested
        if request.path.startswith('/api/'):
            response.headers['Cache-Control'] = 'no-store, max-age=0'
        return response

    return app
