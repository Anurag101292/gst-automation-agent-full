import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

let db = null;

export function initDb() {
  if (db) return db;
  const dbFile = process.env.DATABASE_FILE || path.join(process.cwd(), 'data', 'invoices.db');
  fs.mkdirSync(path.dirname(dbFile), { recursive: true });
  db = new Database(dbFile);
  // create table if not exists
  db.exec(`CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    status TEXT,
    result TEXT,
    created_at TEXT,
    updated_at TEXT
  )`);
  return db;
}
