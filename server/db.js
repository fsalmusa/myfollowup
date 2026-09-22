/**
 * Database layer — SQLite via Node's built-in `node:sqlite` module.
 * Enforces foreign keys + constraints for data integrity.
 */
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// DB file path — overridable via env for tests / CI.
const DB_PATH =
  process.env.DB_PATH || path.join(__dirname, 'crm.db');

// Allow fresh re-creation for tests / reseed.
if (process.env.DB_RESET === '1' && fs.existsSync(DB_PATH)) {
  fs.rmSync(DB_PATH);
  for (const suffix of ['-journal', '-wal', '-shm']) {
    const p = DB_PATH + suffix;
    if (fs.existsSync(p)) fs.rmSync(p);
  }
}

export const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

db.exec(`
CREATE TABLE IF NOT EXISTS groups (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL CHECK (length(trim(name)) > 0),
  description TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customers (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id         INTEGER NOT NULL,
  name             TEXT NOT NULL CHECK (length(trim(name)) > 0),
  phone            TEXT NOT NULL DEFAULT '',
  email_subscribe  TEXT NOT NULL DEFAULT '',
  email_family     TEXT NOT NULL DEFAULT '',
  subscribe_date   TEXT NOT NULL DEFAULT '',
  expiry_date      TEXT NOT NULL DEFAULT '',
  follow_up_status TEXT NOT NULL DEFAULT 'PENDING'
                   CHECK (follow_up_status IN ('PENDING','COMPLETED')),
  last_follow_up_at TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS follow_up_history (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  action      TEXT NOT NULL CHECK (action IN ('FOLLOW_UP','UNFOLLOW_UP','NOTE')),
  note        TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_customers_group      ON customers(group_id);
CREATE INDEX IF NOT EXISTS idx_customers_followup   ON customers(follow_up_status);
CREATE INDEX IF NOT EXISTS idx_customers_expiry     ON customers(expiry_date);
CREATE INDEX IF NOT EXISTS idx_history_customer     ON follow_up_history(customer_id);
`);

/**
 * Return per-group aggregate counts computed live from the customers table.
 * This is the single source of truth for group status / colours.
 */
export function groupStats(groupId) {
  const row = db
    .prepare(
      `SELECT
         COUNT(*)                                      AS total_customers,
         SUM(CASE WHEN follow_up_status='COMPLETED' THEN 1 ELSE 0 END) AS completed,
         SUM(CASE WHEN follow_up_status='PENDING'   THEN 1 ELSE 0 END) AS pending
       FROM customers WHERE group_id = ?`
    )
    .get(groupId);
  const total = row.total_customers || 0;
  const completed = row.completed || 0;
  const pending = row.pending || 0;
  return { total_customers: total, completed, pending };
}

/** Derive group status + colour key from customer counts (never stored). */
export function deriveGroupStatus(total, pending) {
  if (total === 0) return { status: 'KOSONG', color: 'neutral' };
  if (pending > 0) return { status: 'BELUM SELESAI', color: 'red' };
  return { status: 'SELESAI', color: 'green' };
}

/** Shape a group row into its public JSON form with live stats. */
export function shapeGroup(row) {
  const { total_customers, completed, pending } = groupStats(row.id);
  const { status, color } = deriveGroupStatus(total_customers, pending);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    created_at: row.created_at,
    updated_at: row.updated_at,
    total_customers,
    completed,
    pending,
    status,
    color,
  };
}

/** Dashboard aggregate counters (always computed live). */
export function globalStats() {
  const g = db.prepare('SELECT COUNT(*) AS n FROM groups').get();
  const c = db
    .prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN follow_up_status='COMPLETED' THEN 1 ELSE 0 END) AS completed,
         SUM(CASE WHEN follow_up_status='PENDING'   THEN 1 ELSE 0 END) AS pending
       FROM customers`
    )
    .get();
  return {
    total_groups: g.n || 0,
    total_customers: c.total || 0,
    followed_up: c.completed || 0,
    not_followed_up: c.pending || 0,
  };
}

export { DB_PATH };
