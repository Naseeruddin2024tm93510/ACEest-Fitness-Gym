from app import create_app

def test_get_clients():
    app = create_app()
    client = app.test_client()

    res = client.get("/api/clients/")
    assert res.status_code == 200