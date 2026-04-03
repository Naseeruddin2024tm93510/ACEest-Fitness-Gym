from flask import Blueprint, request, jsonify
from app.utils.db import get_connection

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, role FROM users WHERE username=? AND password=?", (username, password))
    row = cur.fetchone()

    if not row:
        conn.close()
        return jsonify({"success": False, "error": "Invalid credentials"}), 401

    user_id, role = row
    extra = {}
    if role == "Client":
        cur.execute("SELECT id, name FROM clients WHERE user_id=?", (user_id,))
        r = cur.fetchone()
        if r:
            extra["client_id"] = r[0]
            extra["name"] = r[1]
    elif role == "Trainer":
        cur.execute("SELECT id, name FROM trainers WHERE user_id=?", (user_id,))
        r = cur.fetchone()
        if r:
            extra["trainer_id"] = r[0]
            extra["name"] = r[1]
    elif role == "Admin":
        extra["name"] = "Admin"
    conn.close()
    return jsonify({"success": True, "user_id": user_id, "role": role, "username": username, **extra}), 200


@auth_bp.route("/register", methods=["POST"])
def register_client():
    data = request.json
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    name = data.get("name", "").strip()
    age = data.get("age")
    phone = data.get("phone", "")
    email = data.get("email", "")
    height = data.get("height")
    weight = data.get("weight")
    goal = data.get("goal", "")
    plan_type = data.get("plan_type", "General")
    body_details = data.get("body_details", "")

    if not username or not password or not name:
        return jsonify({"error": "Username, password, and name are required"}), 400

    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO users (username, password, role) VALUES (?, ?, 'Client')", (username, password))
        user_id = cur.lastrowid
        cur.execute(
            "INSERT INTO clients (user_id, name, age, phone, email, height, weight, goal, plan_type, body_details, status) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')",
            (user_id, name, age, phone, email, height, weight, goal, plan_type, body_details)
        )
        conn.commit()
        return jsonify({"success": True, "message": "Registration successful!"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()


@auth_bp.route("/register-trainer", methods=["POST"])
def register_trainer():
    data = request.json
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    name = data.get("name", "").strip()
    age = data.get("age")
    phone = data.get("phone", "")
    experience = data.get("experience", 0)
    certifications = data.get("certifications", "")

    if not username or not password or not name:
        return jsonify({"error": "Username, password, and name are required"}), 400

    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO users (username, password, role) VALUES (?, ?, 'Trainer')", (username, password))
        user_id = cur.lastrowid
        cur.execute(
            "INSERT INTO trainers (user_id, name, age, phone, experience_years, certifications) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (user_id, name, age, phone, experience, certifications)
        )
        conn.commit()
        return jsonify({"success": True, "message": "Trainer registration successful!"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()
