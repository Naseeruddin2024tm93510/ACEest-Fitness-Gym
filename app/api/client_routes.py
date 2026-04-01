from flask import Blueprint, request, jsonify
from app.services.client_service import fetch_clients, create_client

client_bp = Blueprint("clients", __name__)

@client_bp.route("/", methods=["GET"])
def get_clients():
    return jsonify(fetch_clients())

@client_bp.route("/", methods=["POST"])
def add_client():
    data = request.json
    create_client(data)
    return {"message": "created"}, 201