"""
Unit tests for Admin API (/api/admin)
Tests: create trainer, assign trainer, pending registrations, change requests,
       plan requests, edit client, edit trainer, reactivate, workout/diet/progress management
"""


class TestAdminCreateTrainer:
    """Test admin creating trainers."""

    def test_create_trainer(self, client):
        res = client.post("/api/admin/create-trainer", json={
            "username": "admin_t1", "password": "tp", "name": "Admin Created Trainer",
            "age": 28, "phone": "5550001111", "specialization": "Strength",
            "experience": 3, "certifications": "NSCA"
        })
        assert res.status_code == 201
        # Verify trainer exists
        trainers = client.get("/api/trainers/").get_json()
        assert any(t["name"] == "Admin Created Trainer" for t in trainers)


class TestAdminPendingRegistrations:
    """Test pending registration management."""

    def test_pending_registrations(self, client, seed_client):
        res = client.get("/api/admin/pending-registrations")
        data = res.get_json()
        assert res.status_code == 200
        assert len(data) >= 1
        assert any(c["name"] == "Jane Client" for c in data)


class TestAdminAssignTrainer:
    """Test trainer assignment to client."""

    def test_assign_trainer(self, client, seed_trainer, seed_client):
        cid = seed_client["client_id"]
        tid = seed_trainer["trainer_id"]
        res = client.post("/api/admin/assign-trainer", json={
            "client_id": cid, "trainer_id": tid, "membership_expiry": "2099-12-31"
        })
        assert res.status_code == 200
        # Verify client is now active with trainer
        detail = client.get(f"/api/clients/{cid}").get_json()
        assert detail["status"] == "active"
        assert detail["trainer_id"] == tid
        assert detail["membership_expiry"] == "2099-12-31"


class TestAdminChangeRequests:
    """Test approval/rejection of trainer change requests."""

    def test_approve_trainer_change(self, client, seed_trainer, active_client):
        cid = active_client["client_id"]
        # Create a second trainer
        client.post("/api/admin/create-trainer", json={
            "username": "trainer2", "password": "p2", "name": "Second Trainer"
        })
        trainers = client.get("/api/trainers/").get_json()
        new_tid = [t for t in trainers if t["name"] == "Second Trainer"][0]["id"]
        # Client requests change
        client.post(f"/api/clients/{cid}/trainer-change", json={
            "requested_by": "client", "reason": "Want different style"
        })
        # Admin gets requests
        reqs = client.get("/api/admin/change-requests").get_json()
        assert len(reqs) >= 1
        req_id = reqs[0]["id"]
        # Admin approves
        res = client.post(f"/api/admin/approve-change/{req_id}", json={
            "action": "approved", "new_trainer_id": new_tid
        })
        assert res.status_code == 200


class TestAdminPlanRequests:
    """Test approval/rejection of plan change requests."""

    def test_approve_plan_change(self, client, active_client):
        cid = active_client["client_id"]
        client.post(f"/api/clients/{cid}/plan-change", json={"new_plan": "Competition"})
        reqs = client.get("/api/admin/plan-requests").get_json()
        assert len(reqs) >= 1
        req_id = reqs[0]["id"]
        res = client.post(f"/api/admin/approve-plan/{req_id}", json={"action": "approved"})
        assert res.status_code == 200

    def test_reject_plan_change(self, client, active_client):
        cid = active_client["client_id"]
        client.post(f"/api/clients/{cid}/plan-change", json={"new_plan": "Advanced Trainer"})
        reqs = client.get("/api/admin/plan-requests").get_json()
        req_id = reqs[0]["id"]
        res = client.post(f"/api/admin/approve-plan/{req_id}", json={"action": "rejected"})
        assert res.status_code == 200


class TestAdminEditClient:
    """Test admin editing client details."""

    def test_edit_client_profile(self, client, active_client):
        cid = active_client["client_id"]
        res = client.put(f"/api/admin/edit-client/{cid}", json={
            "name": "Admin Edited Name", "age": 30, "phone": "0000000000",
            "email": "admin_edit@test.com", "height": 180, "weight": 75,
            "goal": "Compete", "body_details": "Mesomorph",
            "plan_type": "Competition", "membership_expiry": "2099-06-30", "status": "active"
        })
        assert res.status_code == 200
        detail = client.get(f"/api/clients/{cid}").get_json()
        assert detail["name"] == "Admin Edited Name"
        assert detail["plan_type"] == "Competition"
        assert detail["email"] == "admin_edit@test.com"


class TestAdminEditTrainer:
    """Test admin editing trainer details."""

    def test_edit_trainer_profile(self, client, seed_trainer):
        tid = seed_trainer["trainer_id"]
        res = client.put(f"/api/admin/edit-trainer/{tid}", json={
            "name": "Edited Trainer", "age": 32, "phone": "9999999999",
            "specialization": "CrossFit", "experience": 8, "certifications": "CPT, ACE, CrossFit L2"
        })
        assert res.status_code == 200
        detail = client.get(f"/api/trainers/{tid}").get_json()
        assert detail["name"] == "Edited Trainer"
        assert detail["specialization"] == "CrossFit"


class TestAdminReactivate:
    """Test admin reactivating expired clients."""

    def test_reactivate_inactive_client(self, client, active_client):
        cid = active_client["client_id"]
        # Make inactive
        client.put(f"/api/admin/edit-client/{cid}", json={
            "name": "Jane Client", "age": 25, "phone": "9876543210",
            "email": "jane@test.com", "height": 165, "weight": 60,
            "goal": "Weight loss", "body_details": "",
            "plan_type": "General", "membership_expiry": "2020-01-01", "status": "inactive"
        })
        detail = client.get(f"/api/clients/{cid}").get_json()
        assert detail["status"] == "inactive"
        # Reactivate
        res = client.post(f"/api/admin/reactivate/{cid}", json={
            "membership_expiry": "2099-12-31"
        })
        assert res.status_code == 200
        detail = client.get(f"/api/clients/{cid}").get_json()
        assert detail["status"] == "active"
        assert detail["membership_expiry"] == "2099-12-31"


class TestAdminWorkoutDiet:
    """Test admin adding workouts, diets, and progress for clients."""

    def test_admin_add_workout(self, client, active_client):
        cid = active_client["client_id"]
        res = client.post("/api/admin/add-workout", json={
            "client_id": cid,
            "plans": [{"week": 1, "day": "Wednesday", "exercise": "Pull-ups", "sets": 3, "reps": 10}]
        })
        assert res.status_code == 201

    def test_admin_add_diet(self, client, active_client):
        cid = active_client["client_id"]
        res = client.post("/api/admin/add-diet", json={
            "client_id": cid,
            "plans": [{"meal_type": "Lunch", "description": "Brown rice + chicken", "calories": 550}]
        })
        assert res.status_code == 201

    def test_admin_add_progress(self, client, active_client):
        cid = active_client["client_id"]
        res = client.post("/api/admin/add-progress", json={
            "client_id": cid, "weight": 58, "waist": 68, "bodyfat": 16, "notes": "Admin logged"
        })
        assert res.status_code == 201
