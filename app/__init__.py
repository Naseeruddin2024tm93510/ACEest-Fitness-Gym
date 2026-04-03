from flask import Flask, send_from_directory
from flask_cors import CORS
import os
from app.utils.db import init_db


def create_app():
    app = Flask(__name__)
    CORS(app)

    init_db()

    from app.api.auth_routes import auth_bp
    from app.api.client_routes import client_bp
    from app.api.trainer_routes import trainer_bp
    from app.api.admin_routes import admin_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(client_bp, url_prefix="/api/clients")
    app.register_blueprint(trainer_bp, url_prefix="/api/trainers")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    # Serve React build
    frontend_dir = os.path.join(app.root_path, '..', 'frontend')

    @app.route("/")
    def serve_index():
        return send_from_directory(frontend_dir, 'index.html')

    @app.route("/<path:path>")
    def serve_static(path):
        file_path = os.path.join(frontend_dir, path)
        if os.path.isfile(file_path):
            return send_from_directory(frontend_dir, path)
        # For React Router: serve index.html for all non-file routes
        return send_from_directory(frontend_dir, 'index.html')

    return app
