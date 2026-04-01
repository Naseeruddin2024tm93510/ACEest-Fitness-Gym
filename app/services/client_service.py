from app.repository.client_repo import get_all_clients, insert_client

def fetch_clients():
    data = get_all_clients()
    return [{"id": d[0], "name": d[1], "age": d[2]} for d in data]

def create_client(payload):
    if not payload.get("name"):
        raise ValueError("Name required")

    insert_client(payload["name"], payload["age"])