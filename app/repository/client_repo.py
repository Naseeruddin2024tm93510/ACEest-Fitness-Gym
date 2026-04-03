from app.utils.db import get_connection


def get_all_clients():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, name, age FROM clients")
    rows = cur.fetchall()
    conn.close()
    return rows


def insert_client(name, age):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO clients (name, age) VALUES (?, ?)",
        (name, age)
    )
    conn.commit()
    conn.close()
