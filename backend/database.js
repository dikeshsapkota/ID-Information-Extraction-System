const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "id_ai_system.db"));

db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS citizens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_text TEXT NOT NULL,
    name TEXT NOT NULL,
    id_number TEXT NOT NULL,
    dob TEXT NOT NULL,
    gender TEXT NOT NULL DEFAULT 'Not detected',
    district TEXT NOT NULL DEFAULT 'Not detected',
    municipality TEXT NOT NULL DEFAULT 'Not detected',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

module.exports = db;