import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev_secret_key')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'dev_jwt_secret')
    JWT_ACCESS_TOKEN_EXPIRES = 3600 # 1 hour
    JWT_REFRESH_TOKEN_EXPIRES = 2592000 # 30 days
    JWT_TOKEN_LOCATION = ['headers', 'cookies']
    JWT_COOKIE_SAMESITE = os.environ.get('JWT_COOKIE_SAMESITE', 'Lax')
    JWT_COOKIE_HTTPONLY = True
    JWT_COOKIE_CSRF_PROTECT = False # Disable CSRF for simplicity in dev/frontend since frontend doesn't send CSRF token yet
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    _cors_env = os.environ.get('CORS_ORIGINS', 'http://localhost:5173,https://life-replay-ai-i4we.vercel.app,capacitor://localhost,http://localhost')
    CORS_ORIGINS = [o.strip() for o in _cors_env.split(',') if o.strip()]
    CORS_SUPPORTS_CREDENTIALS = True
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024 # 10 MB file upload limit
    
    # ─── MAIL / SMTP SETTINGS ───────────────────────────────────────────────────
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'True').lower() in ['true', '1', 't']
    MAIL_USE_SSL = os.environ.get('MAIL_USE_SSL', 'False').lower() in ['true', '1', 't']
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME', '')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD', '')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', os.environ.get('MAIL_USERNAME', 'noreply@lifereplay.ai'))
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

    @classmethod
    def init_app(cls, app):
        pass

class DevelopmentConfig(Config):
    DEBUG = True
    # use sqlite inside the backend/instance directory
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///app.db')
    JWT_COOKIE_SECURE = False

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    JWT_COOKIE_SECURE = False

class ProductionConfig(Config):
    DEBUG = False
    _db_url = os.environ.get('DATABASE_URL', '')
    if _db_url.startswith('postgres://'):
        _db_url = _db_url.replace('postgres://', 'postgresql+psycopg2://', 1)
    elif _db_url.startswith('postgresql://'):
        _db_url = _db_url.replace('postgresql://', 'postgresql+psycopg2://', 1)
    SQLALCHEMY_DATABASE_URI = _db_url or 'postgresql+psycopg2://missing_database_url'
    JWT_COOKIE_SECURE = os.environ.get('JWT_COOKIE_SECURE', 'True').lower() in ['true', '1', 't']

    @classmethod
    def init_app(cls, app):
        db_url = os.environ.get('DATABASE_URL')
        if not db_url:
            raise RuntimeError("DATABASE_URL environment variable is required in production mode to prevent ephemeral data loss.")
        if db_url.startswith('postgres://'):
            db_url = db_url.replace('postgres://', 'postgresql+psycopg2://', 1)
        elif db_url.startswith('postgresql://'):
            db_url = db_url.replace('postgresql://', 'postgresql+psycopg2://', 1)
        app.config['SQLALCHEMY_DATABASE_URI'] = db_url

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
