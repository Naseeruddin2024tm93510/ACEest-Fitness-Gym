"""
Unit tests for Client API (/api/clients)
Tests: list clients, get client detail, update profile, feedback, progress, plan change
"""


class TestClientList:
    """Test client listing endpoint."""

    def test_get_clients_empty(self, client):
        res = client.get("/api/clients/")
        assert res.status_code == 200
        data = res.get_json()
        assert isinstance(data, list)

    def test_get_clients_after_registration(self, client, seed_client):
        res = client.get("/api/clients/")
        data = res.get_json()
        assert len(data) >= 1
        names = [c["name"] for c in data]
        assert "Jane Client" in names


class TestClientDetail:
    """Test single client detail endpoint."""

    def test_get_client_detail(self, client, seed_client):
        cid = seed_client["client_id"]
        res = client.get(f"/api/clients/{cid}")
        data = res.get_json()
        assert res.status_code == 200
        assert data["name"] == "Jane Client"
        assert data["email"] == "jane@test.com"
        assert "workouts" in data
        assert "diets" in data
        assert "progress" in data
        assert "feedback" in data

    def test_get_client_not_found(self, client):
        res = client.get("/api/clients/9999")
        assert res.status_code == 404


class TestClientProfile:
    """Test client profile update."""

    def test_update_profile(self, client, seed_client):
        cid = seed_client["client_id"]
        res = client.put(f"/api/clients/{cid}/profile", json={
            "name": "Jane Updated", "age": 26, "phone": "1111111111",
            "email": "updated@test.com", "height": 166, "weight": 58,
            "goal": "Tone up", "body_details": "Athletic build"
        })
        assert res.status_code == 200
        # Verify the update
        detail = client.get(f"/api/clients/{cid}").get_json()
        assert detail["name"] == "Jane Updated"
        assert detail["email"] == "updated@test.com"
        assert detail["goal"] == "Tone up"


class TestClientFeedback:
    """Test client feedback submission."""

    def test_add_feedback(self, client, active_client):
        cid = active_client["client_id"]
        res = client.post(f"/api/clients/{cid}/feedback", json={
            "message": "Great workout plan, thanks!"
        })
        assert res.status_code == 201
        # Verify feedback appears
        detail = client.get(f"/api/clients/{cid}").get_json()
        assert len(detail["feedback"]) == 1
        assert detail["feedback"][0]["direction"] == "client_to_trainer"


class TestClientProgress:
    """Test client progress logging."""

    def test_log_progress(self, client, active_client):
        cid = active_client["client_id"]
        res = client.post(f"/api/clients/{cid}/progress", json={
            "weight": 59.5, "waist": 72, "bodyfat": 18.5, "notes": "Week 1"
        })
        assert res.status_code == 201
        detail = client.get(f"/api/clients/{cid}").get_json()
        assert len(detail["progress"]) == 1
        assert detail["progress"][0]["weight"] == 59.5


class TestClientPlanChange:
    """Test plan change request."""

    def test_request_plan_change(self, client, active_client):
        cid = active_client["client_id"]
        res = client.post(f"/api/clients/{cid}/plan-change", json={
            "new_plan": "With Trainer"
        })
        assert res.status_code == 201
        detail = client.get(f"/api/clients/{cid}").get_json()
        assert len(detail["plan_requests"]) == 1
        assert detail["plan_requests"][0]["new_plan"] == "With Trainer"
        assert detail["plan_requests"][0]["status"] == "pending"


class TestClientTrainerChange:
    """Test trainer change request."""

    def test_request_trainer_change(self, client, active_client):
        cid = active_client["client_id"]
        res = client.post(f"/api/clients/{cid}/trainer-change", json={
            "requested_by": "client", "reason": "Schedule conflict"
        })
        assert res.status_code == 201
        detail = client.get(f"/api/clients/{cid}").get_json()
        assert len(detail["change_requests"]) == 1
        assert detail["change_requests"][0]["reason"] == "Schedule conflict"
