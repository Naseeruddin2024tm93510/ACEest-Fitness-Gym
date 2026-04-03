from flask import Blueprint, request, jsonify
from app.utils.db import get_connection
from datetime import date

trainer_bp = Blueprint("trainers", __name__)


def _is_client_active(cur, client_id):
    """Check if client is active (not expired). Auto-expire if needed."""
    cur.execute("SELECT status, membership_expiry FROM clients WHERE id=?", (client_id,))
    row = cur.fetchone()
    if not row:
        return False
    status, expiry = row
    if status == 'active' and expiry:
        try:
            if date.fromisoformat(expiry) < date.today():
                cur.execute("UPDATE clients SET status='inactive' WHERE id=?", (client_id,))
                return False
        except ValueError:
            pass
    return status == 'active'


@trainer_bp.route("/", methods=["GET"])
def get_trainers():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, name, specialization, experience_years, age, phone, certifications FROM trainers ORDER BY name")
    rows = cur.fetchall()
    conn.close()
    return jsonify([{"id": r[0], "name": r[1], "specialization": r[2], "experience": r[3],
                     "age": r[4], "phone": r[5], "certifications": r[6]} for r in rows])


@trainer_bp.route("/<int:tid>", methods=["GET"])
def get_trainer(tid):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, name, age, phone, specialization, experience_years, certifications FROM trainers WHERE id=?", (tid,))
    r = cur.fetchone()
    if not r:
        conn.close()
        return jsonify({"error": "Not found"}), 404
    conn.close()
    return jsonify({"id": r[0], "name": r[1], "age": r[2], "phone": r[3],
                    "specialization": r[4], "experience": r[5], "certifications": r[6]})


@trainer_bp.route("/<int:tid>/profile", methods=["PUT"])
def update_trainer_profile(tid):
    data = request.json
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE trainers SET name=?, age=?, phone=?, specialization=?, experience_years=?, certifications=? WHERE id=?",
                (data.get("name"), data.get("age"), data.get("phone"), data.get("specialization"),
                 data.get("experience"), data.get("certifications"), tid))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


@trainer_bp.route("/<int:tid>/clients", methods=["GET"])
def get_trainer_clients(tid):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT c.id, c.name, c.age, c.goal, c.plan_type, c.weight, c.height, c.status, c.membership_expiry, c.phone, c.email
        FROM clients c WHERE c.trainer_id=? ORDER BY c.name
    """, (tid,))
    rows = cur.fetchall()
    conn.close()
    return jsonify([{
        "id": r[0], "name": r[1], "age": r[2], "goal": r[3], "plan_type": r[4],
        "weight": r[5], "height": r[6], "status": r[7], "membership_expiry": r[8],
        "phone": r[9], "email": r[10]
    } for r in rows])


@trainer_bp.route("/<int:tid>/workout-plan", methods=["POST"])
def create_workout_plan(tid):
    data = request.json
    client_id = data.get("client_id")
    conn = get_connection()
    cur = conn.cursor()
    if not _is_client_active(cur, client_id):
        conn.close()
        return jsonify({"error": "Client membership is inactive/expired. Cannot modify."}), 403
    plans = data.get("plans", [])
    for p in plans:
        cur.execute(
            "INSERT INTO workout_plans (client_id, trainer_id, week_number, day, exercise, sets, reps, notes) VALUES (?,?,?,?,?,?,?,?)",
            (client_id, tid, p.get("week", 1), p.get("day"), p.get("exercise"), p.get("sets"), p.get("reps"), p.get("notes", ""))
        )
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": f"{len(plans)} exercises added"}), 201


@trainer_bp.route("/workout-plan/<int:wp_id>", methods=["PUT"])
def update_workout_plan(wp_id):
    data = request.json
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE workout_plans SET day=?, exercise=?, sets=?, reps=?, notes=? WHERE id=?",
                (data.get("day"), data.get("exercise"), data.get("sets"), data.get("reps"), data.get("notes"), wp_id))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


@trainer_bp.route("/workout-plan/<int:wp_id>", methods=["DELETE"])
def delete_workout_plan(wp_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM workout_plans WHERE id=?", (wp_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


@trainer_bp.route("/<int:tid>/diet-plan", methods=["POST"])
def create_diet_plan(tid):
    data = request.json
    client_id = data.get("client_id")
    conn = get_connection()
    cur = conn.cursor()
    if not _is_client_active(cur, client_id):
        conn.close()
        return jsonify({"error": "Client membership is inactive/expired. Cannot modify."}), 403
    plans = data.get("plans", [])
    for p in plans:
        cur.execute("INSERT INTO diet_plans (client_id, trainer_id, meal_type, description, calories) VALUES (?,?,?,?,?)",
                    (client_id, tid, p.get("meal_type"), p.get("description"), p.get("calories")))
    conn.commit()
    conn.close()
    return jsonify({"success": True}), 201


@trainer_bp.route("/diet-plan/<int:dp_id>", methods=["PUT"])
def update_diet_plan(dp_id):
    data = request.json
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE diet_plans SET meal_type=?, description=?, calories=? WHERE id=?",
                (data.get("meal_type"), data.get("description"), data.get("calories"), dp_id))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


@trainer_bp.route("/diet-plan/<int:dp_id>", methods=["DELETE"])
def delete_diet_plan(dp_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM diet_plans WHERE id=?", (dp_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


@trainer_bp.route("/<int:tid>/feedback", methods=["GET"])
def get_trainer_feedback(tid):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT f.id, f.message, f.direction, f.created_at, c.name, f.client_id
        FROM feedback f JOIN clients c ON f.client_id = c.id
        WHERE f.trainer_id=? ORDER BY f.created_at DESC
    """, (tid,))
    rows = cur.fetchall()
    conn.close()
    return jsonify([{"id": r[0], "message": r[1], "direction": r[2], "created_at": r[3], "client_name": r[4], "client_id": r[5]} for r in rows])


@trainer_bp.route("/<int:tid>/feedback", methods=["POST"])
def send_feedback(tid):
    data = request.json
    conn = get_connection()
    cur = conn.cursor()
    client_id = data.get("client_id")
    if not _is_client_active(cur, client_id):
        conn.close()
        return jsonify({"error": "Client membership is inactive/expired. Cannot send feedback."}), 403
    cur.execute("INSERT INTO feedback (client_id, trainer_id, message, direction) VALUES (?,?,?,'trainer_to_client')",
                (data.get("client_id"), tid, data.get("message", "")))
    conn.commit()
    conn.close()
    return jsonify({"success": True}), 201


@trainer_bp.route("/<int:tid>/transfer-client", methods=["POST"])
def transfer_client(tid):
    data = request.json
    client_id = data.get("client_id")
    reason = data.get("reason", "Trainer initiated transfer")
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO trainer_change_requests (client_id, current_trainer_id, requested_by, reason) VALUES (?,?,'trainer',?)",
                (client_id, tid, reason))
    conn.commit()
    conn.close()
    return jsonify({"success": True}), 201


@trainer_bp.route("/<int:tid>/log-progress", methods=["POST"])
def trainer_log_progress(tid):
    data = request.json
    client_id = data.get("client_id")
    conn = get_connection()
    cur = conn.cursor()
    if not _is_client_active(cur, client_id):
        conn.close()
        return jsonify({"error": "Client membership is inactive/expired. Cannot log progress."}), 403
    cur.execute("INSERT INTO progress (client_id, weight, waist, bodyfat, notes) VALUES (?,?,?,?,?)",
                (client_id, data.get("weight"), data.get("waist"), data.get("bodyfat"), data.get("notes", "")))
    conn.commit()
    conn.close()
    return jsonify({"success": True}), 201
