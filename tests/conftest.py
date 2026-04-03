"""
Shared test fixtures for ACEest Fitness & Gym unit tests.
Creates an isolated temp database for each test function.
"""
import pytest
import os
import app.utils.db as db_module


@pytest.fixture(autouse=True)
def isolate_db(tmp_path):
    """Redirect DB to a temp directory for each test, then restore."""
    original_name = db_module.DB_NAME
    db_module.DB_NAME = str(tmp_path / "test_fitness.db")
    # Initialize schema in the temp DB
    db_module.init_db()
    yield
    db_module.DB_NAME = original_name


@pytest.fixture
def client():
    """Flask test client."""
    from app import create_app
    application = create_app()
    application.config["TESTING"] = True
    return application.test_client()


@pytest.fixture
def seed_trainer(client):
    """Register a trainer and return login data with trainer_id."""
    client.post("/api/auth/register-trainer", json={
        "username": "trainer1", "password": "pass123", "name": "John Trainer",
        "age": 30, "phone": "1234567890", "experience": 5, "certifications": "CPT, NASM"
    })
    login = client.post("/api/auth/login", json={"username": "trainer1", "password": "pass123"})
    return login.get_json()


@pytest.fixture
def seed_client(client):
    """Register a client and return login data with client_id."""
    client.post("/api/auth/register", json={
        "username": "client1", "password": "pass123", "name": "Jane Client",
        "age": 25, "phone": "9876543210", "email": "jane@test.com",
        "height": 165, "weight": 60, "goal": "Weight loss", "plan_type": "General"
    })
    login = client.post("/api/auth/login", json={"username": "client1", "password": "pass123"})
    return login.get_json()


@pytest.fixture
def active_client(client, seed_trainer, seed_client):
    """A client assigned to a trainer with active membership (expiry 2099)."""
    client.post("/api/admin/assign-trainer", json={
        "client_id": seed_client["client_id"],
        "trainer_id": seed_trainer["trainer_id"],
        "membership_expiry": "2099-12-31"
    })
    return seed_client
