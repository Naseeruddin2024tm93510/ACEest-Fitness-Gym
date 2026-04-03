-- ACEest Fitness & Gym — Full Schema v2

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('Admin','Trainer','Client')),
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trainers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    name TEXT NOT NULL,
    age INTEGER,
    phone TEXT,
    specialization TEXT,
    experience_years INTEGER DEFAULT 0,
    certifications TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    name TEXT NOT NULL,
    age INTEGER,
    phone TEXT,
    email TEXT,
    height REAL,
    weight REAL,
    goal TEXT,
    plan_type TEXT DEFAULT 'General' CHECK(plan_type IN ('General','With Trainer','Advanced Trainer','Competition')),
    trainer_id INTEGER,
    membership_expiry TEXT,
    body_details TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','active','inactive')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (trainer_id) REFERENCES trainers(id)
);

CREATE TABLE IF NOT EXISTS workout_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    trainer_id INTEGER,
    week_number INTEGER DEFAULT 1,
    day TEXT,
    exercise TEXT,
    sets INTEGER,
    reps INTEGER,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (trainer_id) REFERENCES trainers(id)
);

CREATE TABLE IF NOT EXISTS diet_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    trainer_id INTEGER,
    meal_type TEXT CHECK(meal_type IN ('Breakfast','Lunch','Snack','Dinner','Pre-Workout','Post-Workout')),
    description TEXT,
    calories INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (trainer_id) REFERENCES trainers(id)
);

CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    date TEXT DEFAULT (date('now')),
    weight REAL,
    waist REAL,
    bodyfat REAL,
    notes TEXT,
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    trainer_id INTEGER,
    message TEXT NOT NULL,
    direction TEXT CHECK(direction IN ('client_to_trainer','trainer_to_client')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (trainer_id) REFERENCES trainers(id)
);

CREATE TABLE IF NOT EXISTS trainer_change_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    current_trainer_id INTEGER,
    requested_by TEXT DEFAULT 'client' CHECK(requested_by IN ('client','trainer')),
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (current_trainer_id) REFERENCES trainers(id)
);

CREATE TABLE IF NOT EXISTS plan_change_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    old_plan TEXT,
    new_plan TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- Seed admin (only if not already exists)
INSERT OR IGNORE INTO users (username, password, role) VALUES ('admin', 'admin', 'Admin');