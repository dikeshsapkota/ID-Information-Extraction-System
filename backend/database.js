const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "id_ai_system.db"));

db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS citizens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_text TEXT NOT NULL,
    owner_id TEXT NOT NULL DEFAULT 'legacy-admin',
    name TEXT NOT NULL,
    id_number TEXT NOT NULL,
    dob TEXT NOT NULL,
    gender TEXT NOT NULL DEFAULT 'Not detected',
    district TEXT NOT NULL DEFAULT 'Not detected',
    municipality TEXT NOT NULL DEFAULT 'Not detected',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const columns = db.prepare("PRAGMA table_info(citizens)").all();
if (!columns.some((column) => column.name === "owner_id")) {
  db.exec(`ALTER TABLE citizens ADD COLUMN owner_id TEXT NOT NULL DEFAULT 'legacy-admin'`);
}

db.exec(`CREATE INDEX IF NOT EXISTS citizens_owner_id_idx ON citizens(owner_id)`);

module.exports = db;
