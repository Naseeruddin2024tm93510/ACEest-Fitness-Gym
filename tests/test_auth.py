"""
Unit tests for Authentication API (/api/auth)
Tests: login, register client, register trainer, validation, duplicates
"""


class TestAdminLogin:
    """Test admin login functionality."""

    def test_admin_login_success(self, client):
        res = client.post("/api/auth/login", json={"username": "admin", "password": "admin"})
        data = res.get_json()
        assert res.status_code == 200
        assert data["success"] is True
        assert data["role"] == "Admin"
        assert data["username"] == "admin"

    def test_login_invalid_credentials(self, client):
        res = client.post("/api/auth/login", json={"username": "admin", "password": "wrong"})
        assert res.status_code == 401
        assert res.get_json()["success"] is False

    def test_login_empty_credentials(self, client):
        res = client.post("/api/auth/login", json={"username": "", "password": ""})
        assert res.status_code == 401

    def test_login_nonexistent_user(self, client):
        res = client.post("/api/auth/login", json={"username": "ghost", "password": "none"})
        assert res.status_code == 401


class TestClientRegistration:
    """Test client registration and login flow."""

    def test_register_client_success(self, client):
        res = client.post("/api/auth/register", json={
            "username": "newclient", "password": "pass", "name": "New Client",
            "age": 28, "phone": "5551234567", "email": "new@test.com",
            "height": 170, "weight": 70, "goal": "Muscle gain", "plan_type": "General"
        })
        assert res.status_code == 201
        assert res.get_json()["success"] is True

    def test_register_client_then_login(self, client):
        client.post("/api/auth/register", json={
            "username": "logintest", "password": "mypass", "name": "Login Tester"
        })
        res = client.post("/api/auth/login", json={"username": "logintest", "password": "mypass"})
        data = res.get_json()
        assert res.status_code == 200
        assert data["role"] == "Client"
        assert data["name"] == "Login Tester"
        assert "client_id" in data

    def test_register_client_missing_fields(self, client):
        # Missing name — should fail validation
        res = client.post("/api/auth/register", json={"username": "u", "password": "p", "name": ""})
        assert res.status_code == 400

    def test_register_duplicate_username(self, client):
        client.post("/api/auth/register", json={
            "username": "dupeuser", "password": "p", "name": "User One"
        })
        res = client.post("/api/auth/register", json={
            "username": "dupeuser", "password": "p2", "name": "User Two"
        })
        assert res.status_code == 400


class TestTrainerRegistration:
    """Test trainer registration and login flow."""

    def test_register_trainer_success(self, client):
        res = client.post("/api/auth/register-trainer", json={
            "username": "trainer_new", "password": "tpass", "name": "New Trainer",
            "age": 35, "phone": "1112223333", "experience": 10, "certifications": "ACE"
        })
        assert res.status_code == 201
        assert res.get_json()["success"] is True

    def test_register_trainer_then_login(self, client):
        client.post("/api/auth/register-trainer", json={
            "username": "tlogin", "password": "tp", "name": "Trainer Login"
        })
        res = client.post("/api/auth/login", json={"username": "tlogin", "password": "tp"})
        data = res.get_json()
        assert res.status_code == 200
        assert data["role"] == "Trainer"
        assert "trainer_id" in data

    def test_register_trainer_missing_name(self, client):
        res = client.post("/api/auth/register-trainer", json={
            "username": "t", "password": "p", "name": ""
        })
        assert res.status_code == 400
