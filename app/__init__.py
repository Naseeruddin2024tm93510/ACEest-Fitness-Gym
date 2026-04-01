from flask import Flask
from app.api.client_routes import client_bp

def create_app():
    app = Flask(__name__)

    app.register_blueprint(client_bp, url_prefix="/api/clients")

    return app