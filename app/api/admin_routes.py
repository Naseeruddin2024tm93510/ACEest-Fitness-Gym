from flask import Blueprint, request, jsonify
from app.utils.db import get_connection

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/create-trainer", methods=["POST"])
def create_trainer():
    data = request.json
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    name = data.get("name", "").strip()
    age = data.get("age")
    phone = data.get("phone", "")
    specialization = data.get("specialization", "")
    experience = data.get("experience", 0)
    certifications = data.get("certifications", "")

    if not username or not password or not name:
        return jsonify({"error": "Username, password, and name required"}), 400

    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO users (username, password, role) VALUES (?, ?, 'Trainer')", (username, password))
        user_id = cur.lastrowid
        cur.execute("INSERT INTO trainers (user_id, name, age, phone, specialization, experience_years, certifications) VALUES (?,?,?,?,?,?,?)",
                    (user_id, name, age, phone, specialization, experience, certifications))
        conn.commit()
        return jsonify({"success": True}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()


@admin_bp.route("/pending-registrations", methods=["GET"])
def pending_registrations():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, name, age, goal, plan_type, weight, height, phone, email FROM clients WHERE status='pending' ORDER BY id DESC")
    rows = cur.fetchall()
    conn.close()
    return jsonify([{"id": r[0], "name": r[1], "age": r[2], "goal": r[3], "plan_type": r[4],
                     "weight": r[5], "height": r[6], "phone": r[7], "email": r[8]} for r in rows])


@admin_bp.route("/assign-trainer", methods=["POST"])
def assign_trainer():
    data = request.json
    client_id = data.get("client_id")
    trainer_id = data.get("trainer_id")
    membership_expiry = data.get("membership_expiry", "")
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE clients SET trainer_id=?, status='active', membership_expiry=? WHERE id=?",
                (trainer_id, membership_expiry, client_id))
    conn.commit()
    conn.close()
    return jsonify({"success": True}), 200


@admin_bp.route("/change-requests", methods=["GET"])
def get_change_requests():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT cr.id, c.name, t.name, cr.reason, cr.status, cr.created_at, cr.requested_by, cr.client_id
        FROM trainer_change_requests cr
        JOIN clients c ON cr.client_id = c.id
        LEFT JOIN trainers t ON cr.current_trainer_id = t.id
        WHERE cr.status='pending' ORDER BY cr.created_at DESC
    """)
    rows = cur.fetchall()
    conn.close()
    return jsonify([{"id": r[0], "client_name": r[1], "current_trainer": r[2], "reason": r[3],
                     "status": r[4], "created_at": r[5], "requested_by": r[6], "client_id": r[7]} for r in rows])


@admin_bp.route("/approve-change/<int:req_id>", methods=["POST"])
def approve_change(req_id):
    data = request.json
    action = data.get("action", "approved")
    new_trainer_id = data.get("new_trainer_id")
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE trainer_change_requests SET status=? WHERE id=?", (action, req_id))
    if action == "approved" and new_trainer_id:
        cur.execute("SELECT client_id FROM trainer_change_requests WHERE id=?", (req_id,))
        row = cur.fetchone()
        if row:
            cur.execute("UPDATE clients SET trainer_id=? WHERE id=?", (new_trainer_id, row[0]))
    conn.commit()
    conn.close()
    return jsonify({"success": True}), 200


@admin_bp.route("/plan-requests", methods=["GET"])
def get_plan_requests():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT pr.id, c.name, pr.old_plan, pr.new_plan, pr.status, pr.created_at
        FROM plan_change_requests pr JOIN clients c ON pr.client_id = c.id
        WHERE pr.status='pending' ORDER BY pr.created_at DESC
    """)
    rows = cur.fetchall()
    conn.close()
    return jsonify([{"id": r[0], "client_name": r[1], "old_plan": r[2], "new_plan": r[3],
                     "status": r[4], "created_at": r[5]} for r in rows])


@admin_bp.route("/approve-plan/<int:req_id>", methods=["POST"])
def approve_plan(req_id):
    data = request.json
    action = data.get("action", "approved")
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE plan_change_requests SET status=? WHERE id=?", (action, req_id))
    if action == "approved":
        cur.execute("SELECT client_id, new_plan FROM plan_change_requests WHERE id=?", (req_id,))
        row = cur.fetchone()
        if row:
            cur.execute("UPDATE clients SET plan_type=? WHERE id=?", (row[1], row[0]))
    conn.commit()
    conn.close()
    return jsonify({"success": True}), 200


@admin_bp.route("/add-workout", methods=["POST"])
def admin_add_workout():
    data = request.json
    client_id = data.get("client_id")
    plans = data.get("plans", [])
    conn = get_connection()
    cur = conn.cursor()
    for p in plans:
        cur.execute(
            "INSERT INTO workout_plans (client_id, trainer_id, week_number, day, exercise, sets, reps, notes) VALUES (?,NULL,?,?,?,?,?,?)",
            (client_id, p.get("week", 1), p.get("day"), p.get("exercise"), p.get("sets"), p.get("reps"), p.get("notes", ""))
        )
    conn.commit()
    conn.close()
    return jsonify({"success": True}), 201


@admin_bp.route("/add-diet", methods=["POST"])
def admin_add_diet():
    data = request.json
    client_id = data.get("client_id")
    plans = data.get("plans", [])
    conn = get_connection()
    cur = conn.cursor()
    for p in plans:
        cur.execute("INSERT INTO diet_plans (client_id, trainer_id, meal_type, description, calories) VALUES (?,NULL,?,?,?)",
                    (client_id, p.get("meal_type"), p.get("description"), p.get("calories")))
    conn.commit()
    conn.close()
    return jsonify({"success": True}), 201


@admin_bp.route("/add-progress", methods=["POST"])
def admin_add_progress():
    data = request.json
    client_id = data.get("client_id")
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO progress (client_id, weight, waist, bodyfat, notes) VALUES (?,?,?,?,?)",
                (client_id, data.get("weight"), data.get("waist"), data.get("bodyfat"), data.get("notes", "")))
    conn.commit()
    conn.close()
    return jsonify({"success": True}), 201


@admin_bp.route("/edit-client/<int:cid>", methods=["PUT"])
def admin_edit_client(cid):
    data = request.json
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        UPDATE clients SET name=?, age=?, phone=?, email=?, height=?, weight=?,
        goal=?, body_details=?, plan_type=?, membership_expiry=?, status=?
        WHERE id=?
    """, (data.get("name"), data.get("age"), data.get("phone"), data.get("email"),
          data.get("height"), data.get("weight"), data.get("goal"), data.get("body_details"),
          data.get("plan_type"), data.get("membership_expiry"), data.get("status"), cid))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


@admin_bp.route("/edit-trainer/<int:tid>", methods=["PUT"])
def admin_edit_trainer(tid):
    data = request.json
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        UPDATE trainers SET name=?, age=?, phone=?, specialization=?, experience_years=?, certifications=?
        WHERE id=?
    """, (data.get("name"), data.get("age"), data.get("phone"), data.get("specialization"),
          data.get("experience"), data.get("certifications"), tid))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


@admin_bp.route("/reactivate/<int:cid>", methods=["POST"])
def reactivate_client(cid):
    data = request.json
    new_expiry = data.get("membership_expiry", "")
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE clients SET status='active', membership_expiry=? WHERE id=?", (new_expiry, cid))
    conn.commit()
    conn.close()
    return jsonify({"success": True})
