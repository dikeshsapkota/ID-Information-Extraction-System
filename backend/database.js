const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");

let dbPromise;

async function connectDB() {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = (async () => {
    const db = await open({
      filename: path.join(__dirname, "id_ai_system.db"),
      driver: sqlite3.Database,
    });

    await db.exec("PRAGMA foreign_keys = ON");

    await db.exec(`
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

    const columns = await db.all("PRAGMA table_info(citizens)");
    const columnNames = columns.map((column) => column.name);

    if (!columnNames.includes("gender")) {
      await db.exec("ALTER TABLE citizens ADD COLUMN gender TEXT NOT NULL DEFAULT 'Not detected'");
    }

    if (!columnNames.includes("district")) {
      await db.exec("ALTER TABLE citizens ADD COLUMN district TEXT NOT NULL DEFAULT 'Not detected'");
    }

    if (!columnNames.includes("municipality")) {
      await db.exec("ALTER TABLE citizens ADD COLUMN municipality TEXT NOT NULL DEFAULT 'Not detected'");
    }

    return db;
  })();

  return dbPromise;
}

module.exports = connectDB;
