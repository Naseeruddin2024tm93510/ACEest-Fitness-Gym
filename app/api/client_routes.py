from flask import Blueprint, request, jsonify
from app.utils.db import get_connection
from datetime import date

client_bp = Blueprint("clients", __name__)


@client_bp.route("/", methods=["GET"])
def get_clients():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT c.id, c.name, c.age, c.goal, c.plan_type, c.status,
               c.weight, c.height, c.membership_expiry, c.body_details,
               c.phone, c.email,
               t.name as trainer_name, c.trainer_id
        FROM clients c LEFT JOIN trainers t ON c.trainer_id = t.id
        ORDER BY c.id DESC
    """)
    rows = cur.fetchall()
    conn.close()
    return jsonify([{
        "id": r[0], "name": r[1], "age": r[2], "goal": r[3],
        "plan_type": r[4], "status": r[5], "weight": r[6],
        "height": r[7], "membership_expiry": r[8], "body_details": r[9],
        "phone": r[10], "email": r[11],
        "trainer_name": r[12], "trainer_id": r[13]
    } for r in rows])


@client_bp.route("/<int:cid>", methods=["GET"])
def get_client(cid):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT c.id, c.name, c.age, c.phone, c.email, c.height, c.weight,
               c.goal, c.plan_type, c.trainer_id, c.membership_expiry,
               c.body_details, c.status, t.name as trainer_name
        FROM clients c LEFT JOIN trainers t ON c.trainer_id = t.id WHERE c.id=?
    """, (cid,))
    r = cur.fetchone()
    if not r:
        conn.close()
        return jsonify({"error": "Not found"}), 404

    # Auto-expire: if membership_expiry has passed, set status to inactive
    status = r[12]
    expiry = r[10]
    if status == 'active' and expiry:
        try:
            exp_date = date.fromisoformat(expiry)
            if exp_date < date.today():
                cur.execute("UPDATE clients SET status='inactive' WHERE id=?", (cid,))
                conn.commit()
                status = 'inactive'
        except ValueError:
            pass

    client = {
        "id": r[0], "name": r[1], "age": r[2], "phone": r[3], "email": r[4],
        "height": r[5], "weight": r[6], "goal": r[7], "plan_type": r[8],
        "trainer_id": r[9], "membership_expiry": r[10], "body_details": r[11],
        "status": status, "trainer_name": r[13]
    }

    cur.execute("SELECT id, week_number, day, exercise, sets, reps, notes FROM workout_plans WHERE client_id=? ORDER BY week_number, day", (cid,))
    client["workouts"] = [{"id": w[0], "week": w[1], "day": w[2], "exercise": w[3], "sets": w[4], "reps": w[5], "notes": w[6]} for w in cur.fetchall()]

    cur.execute("SELECT id, meal_type, description, calories FROM diet_plans WHERE client_id=? ORDER BY id", (cid,))
    client["diets"] = [{"id": d[0], "meal_type": d[1], "description": d[2], "calories": d[3]} for d in cur.fetchall()]

    cur.execute("SELECT date, weight, waist, bodyfat, notes FROM progress WHERE client_id=? ORDER BY date DESC LIMIT 20", (cid,))
    client["progress"] = [{"date": p[0], "weight": p[1], "waist": p[2], "bodyfat": p[3], "notes": p[4]} for p in cur.fetchall()]

    cur.execute("SELECT message, direction, created_at FROM feedback WHERE client_id=? ORDER BY created_at DESC", (cid,))
    client["feedback"] = [{"message": f[0], "direction": f[1], "created_at": f[2]} for f in cur.fetchall()]

    cur.execute("SELECT id, reason, status, created_at FROM trainer_change_requests WHERE client_id=? ORDER BY created_at DESC", (cid,))
    client["change_requests"] = [{"id": cr[0], "reason": cr[1], "status": cr[2], "created_at": cr[3]} for cr in cur.fetchall()]

    cur.execute("SELECT id, old_plan, new_plan, status, created_at FROM plan_change_requests WHERE client_id=? ORDER BY created_at DESC", (cid,))
    client["plan_requests"] = [{"id": pr[0], "old_plan": pr[1], "new_plan": pr[2], "status": pr[3], "created_at": pr[4]} for pr in cur.fetchall()]

    conn.close()
    return jsonify(client)


@client_bp.route("/<int:cid>/profile", methods=["PUT"])
def update_profile(cid):
    data = request.json
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        UPDATE clients SET name=?, age=?, phone=?, email=?, height=?, weight=?, goal=?, body_details=?
        WHERE id=?
    """, (data.get("name"), data.get("age"), data.get("phone"), data.get("email"),
          data.get("height"), data.get("weight"), data.get("goal"), data.get("body_details"), cid))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


@client_bp.route("/<int:cid>/feedback", methods=["POST"])
def add_feedback(cid):
    data = request.json
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT trainer_id FROM clients WHERE id=?", (cid,))
    row = cur.fetchone()
    tid = row[0] if row else None
    cur.execute("INSERT INTO feedback (client_id, trainer_id, message, direction) VALUES (?,?,?,'client_to_trainer')",
                (cid, tid, data.get("message", "")))
    conn.commit()
    conn.close()
    return jsonify({"success": True}), 201


@client_bp.route("/<int:cid>/trainer-change", methods=["POST"])
def request_trainer_change(cid):
    data = request.json
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT trainer_id FROM clients WHERE id=?", (cid,))
    row = cur.fetchone()
    tid = row[0] if row else None
    cur.execute("INSERT INTO trainer_change_requests (client_id, current_trainer_id, requested_by, reason) VALUES (?,?,?,?)",
                (cid, tid, data.get("requested_by", "client"), data.get("reason", "")))
    conn.commit()
    conn.close()
    return jsonify({"success": True}), 201


@client_bp.route("/<int:cid>/progress", methods=["POST"])
def log_progress(cid):
    data = request.json
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO progress (client_id, weight, waist, bodyfat, notes) VALUES (?,?,?,?,?)",
                (cid, data.get("weight"), data.get("waist"), data.get("bodyfat"), data.get("notes", "")))
    conn.commit()
    conn.close()
    return jsonify({"success": True}), 201


@client_bp.route("/<int:cid>/plan-change", methods=["POST"])
def request_plan_change(cid):
    data = request.json
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT plan_type FROM clients WHERE id=?", (cid,))
    row = cur.fetchone()
    old_plan = row[0] if row else ""
    cur.execute("INSERT INTO plan_change_requests (client_id, old_plan, new_plan) VALUES (?,?,?)",
                (cid, old_plan, data.get("new_plan")))
    conn.commit()
    conn.close()
    return jsonify({"success": True}), 201
