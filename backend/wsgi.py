import os
from app import create_app
from app.extensions import db

env_name = os.environ.get('FLASK_ENV') or ('production' if os.environ.get('RENDER') else 'development')
app = create_app(env_name)

with app.app_context():
    db.create_all()

