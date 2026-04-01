from app.services.client_service import create_client

def test_create_client_invalid():
    try:
        create_client({})
        assert False
    except ValueError:
        assert True