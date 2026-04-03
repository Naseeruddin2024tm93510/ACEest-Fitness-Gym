import sqlite3
import os

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DB_DIR = os.environ.get("DB_DIR", BASE_DIR)
DB_NAME = os.path.join(DB_DIR, "fitness.db")
SCHEMA_PATH = os.path.join(BASE_DIR, "app", "models", "schema.sql")


def get_connection():
    return sqlite3.connect(DB_NAME)


def init_db():
    if not os.path.exists(DB_NAME):
        print("Initializing database...")

    conn = get_connection()
    cur = conn.cursor()

    with open(SCHEMA_PATH, "r") as f:
        cur.executescript(f.read())

    conn.commit()
    conn.close()
