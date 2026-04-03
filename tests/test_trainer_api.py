"""
Unit tests for Trainer API (/api/trainers)
Tests: list, get clients, workout CRUD, diet CRUD, progress logging,
       feedback, transfer request, inactive client blocking
"""


class TestTrainerList:
    """Test trainer listing."""

    def test_get_trainers(self, client, seed_trainer):
        res = client.get("/api/trainers/")
        data = res.get_json()
        assert res.status_code == 200
        assert len(data) >= 1
        assert data[0]["name"] == "John Trainer"

    def test_get_trainer_detail(self, client, seed_trainer):
        tid = seed_trainer["trainer_id"]
        res = client.get(f"/api/trainers/{tid}")
        data = res.get_json()
        assert res.status_code == 200
        assert data["name"] == "John Trainer"
        assert data["experience"] == 5


class TestTrainerClients:
    """Test trainer's client management."""

    def test_get_trainer_clients(self, client, seed_trainer, active_client):
        tid = seed_trainer["trainer_id"]
        res = client.get(f"/api/trainers/{tid}/clients")
        data = res.get_json()
        assert res.status_code == 200
        assert len(data) >= 1
        assert data[0]["name"] == "Jane Client"


class TestWorkoutCRUD:
    """Test trainer workout plan operations."""

    def test_add_workout(self, client, seed_trainer, active_client):
        tid = seed_trainer["trainer_id"]
        cid = active_client["client_id"]
        res = client.post(f"/api/trainers/{tid}/workout-plan", json={
            "client_id": cid,
            "plans": [{"day": "Monday", "exercise": "Squats", "sets": 4, "reps": 12, "notes": "Warm up first"}]
        })
        assert res.status_code == 201
        detail = client.get(f"/api/clients/{cid}").get_json()
        assert len(detail["workouts"]) == 1
        assert detail["workouts"][0]["exercise"] == "Squats"

    def test_update_workout(self, client, seed_trainer, active_client):
        tid = seed_trainer["trainer_id"]
        cid = active_client["client_id"]
        client.post(f"/api/trainers/{tid}/workout-plan", json={
            "client_id": cid, "plans": [{"day": "Monday", "exercise": "Bench Press", "sets": 3, "reps": 10}]
        })
        detail = client.get(f"/api/clients/{cid}").get_json()
        wp_id = detail["workouts"][0]["id"]
        res = client.put(f"/api/trainers/workout-plan/{wp_id}", json={
            "day": "Tuesday", "exercise": "Incline Press", "sets": 4, "reps": 8
        })
        assert res.status_code == 200
        updated = client.get(f"/api/clients/{cid}").get_json()
        assert updated["workouts"][0]["exercise"] == "Incline Press"
        assert updated["workouts"][0]["day"] == "Tuesday"

    def test_delete_workout(self, client, seed_trainer, active_client):
        tid = seed_trainer["trainer_id"]
        cid = active_client["client_id"]
        client.post(f"/api/trainers/{tid}/workout-plan", json={
            "client_id": cid, "plans": [{"day": "Friday", "exercise": "Deadlifts", "sets": 5, "reps": 5}]
        })
        detail = client.get(f"/api/clients/{cid}").get_json()
        wp_id = detail["workouts"][0]["id"]
        res = client.delete(f"/api/trainers/workout-plan/{wp_id}")
        assert res.status_code == 200
        after = client.get(f"/api/clients/{cid}").get_json()
        assert len(after["workouts"]) == 0


class TestDietCRUD:
    """Test trainer diet plan operations."""

    def test_add_diet(self, client, seed_trainer, active_client):
        tid = seed_trainer["trainer_id"]
        cid = active_client["client_id"]
        res = client.post(f"/api/trainers/{tid}/diet-plan", json={
            "client_id": cid,
            "plans": [{"meal_type": "Breakfast", "description": "Oats with banana", "calories": 350}]
        })
        assert res.status_code == 201
        detail = client.get(f"/api/clients/{cid}").get_json()
        assert len(detail["diets"]) == 1
        assert detail["diets"][0]["description"] == "Oats with banana"

    def test_update_diet(self, client, seed_trainer, active_client):
        tid = seed_trainer["trainer_id"]
        cid = active_client["client_id"]
        client.post(f"/api/trainers/{tid}/diet-plan", json={
            "client_id": cid, "plans": [{"meal_type": "Lunch", "description": "Grilled chicken", "calories": 500}]
        })
        detail = client.get(f"/api/clients/{cid}").get_json()
        dp_id = detail["diets"][0]["id"]
        res = client.put(f"/api/trainers/diet-plan/{dp_id}", json={
            "meal_type": "Dinner", "description": "Salmon with veggies", "calories": 450
        })
        assert res.status_code == 200
        updated = client.get(f"/api/clients/{cid}").get_json()
        assert updated["diets"][0]["description"] == "Salmon with veggies"

    def test_delete_diet(self, client, seed_trainer, active_client):
        tid = seed_trainer["trainer_id"]
        cid = active_client["client_id"]
        client.post(f"/api/trainers/{tid}/diet-plan", json={
            "client_id": cid, "plans": [{"meal_type": "Snack", "description": "Protein bar", "calories": 200}]
        })
        detail = client.get(f"/api/clients/{cid}").get_json()
        dp_id = detail["diets"][0]["id"]
        res = client.delete(f"/api/trainers/diet-plan/{dp_id}")
        assert res.status_code == 200


class TestTrainerProgressLog:
    """Test trainer logging client progress."""

    def test_log_progress(self, client, seed_trainer, active_client):
        tid = seed_trainer["trainer_id"]
        cid = active_client["client_id"]
        res = client.post(f"/api/trainers/{tid}/log-progress", json={
            "client_id": cid, "weight": 59, "waist": 70, "bodyfat": 17, "notes": "Good progress"
        })
        assert res.status_code == 201
        detail = client.get(f"/api/clients/{cid}").get_json()
        assert len(detail["progress"]) == 1


class TestTrainerFeedback:
    """Test trainer sending feedback."""

    def test_send_feedback(self, client, seed_trainer, active_client):
        tid = seed_trainer["trainer_id"]
        cid = active_client["client_id"]
        res = client.post(f"/api/trainers/{tid}/feedback", json={
            "client_id": cid, "message": "Increase sets next week"
        })
        assert res.status_code == 201


class TestInactiveClientBlocking:
    """Test that trainers get 403 when modifying inactive/expired clients."""

    def _make_inactive(self, client, cid):
        """Helper: set client to inactive via admin edit."""
        # Get current client data first
        detail = client.get(f"/api/clients/{cid}").get_json()
        client.put(f"/api/admin/edit-client/{cid}", json={
            "name": detail["name"], "age": detail["age"], "phone": detail["phone"],
            "email": detail["email"], "height": detail["height"], "weight": detail["weight"],
            "goal": detail["goal"], "body_details": detail.get("body_details", ""),
            "plan_type": detail["plan_type"], "membership_expiry": "2020-01-01", "status": "inactive"
        })

    def test_block_workout_for_inactive(self, client, seed_trainer, active_client):
        tid = seed_trainer["trainer_id"]
        cid = active_client["client_id"]
        self._make_inactive(client, cid)
        res = client.post(f"/api/trainers/{tid}/workout-plan", json={
            "client_id": cid, "plans": [{"day": "Monday", "exercise": "Squats", "sets": 3, "reps": 10}]
        })
        assert res.status_code == 403

    def test_block_diet_for_inactive(self, client, seed_trainer, active_client):
        tid = seed_trainer["trainer_id"]
        cid = active_client["client_id"]
        self._make_inactive(client, cid)
        res = client.post(f"/api/trainers/{tid}/diet-plan", json={
            "client_id": cid, "plans": [{"meal_type": "Breakfast", "description": "Oats", "calories": 300}]
        })
        assert res.status_code == 403

    def test_block_progress_for_inactive(self, client, seed_trainer, active_client):
        tid = seed_trainer["trainer_id"]
        cid = active_client["client_id"]
        self._make_inactive(client, cid)
        res = client.post(f"/api/trainers/{tid}/log-progress", json={
            "client_id": cid, "weight": 60, "waist": 71, "bodyfat": 18
        })
        assert res.status_code == 403

    def test_block_feedback_for_inactive(self, client, seed_trainer, active_client):
        tid = seed_trainer["trainer_id"]
        cid = active_client["client_id"]
        self._make_inactive(client, cid)
        res = client.post(f"/api/trainers/{tid}/feedback", json={
            "client_id": cid, "message": "Should not work"
        })
        assert res.status_code == 403
