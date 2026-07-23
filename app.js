// db/index.js
// Uses Node's built-in node:sqlite (stable-enough for launch; swap the
// DSN for Postgres later with zero change to route code if you keep
// queries this simple — see README "Growing past SQLite").
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'tradebid.db'));

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('homeowner','contractor','admin')),
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    failed_login_count INTEGER NOT NULL DEFAULT 0,
    locked_until TEXT
  );

  CREATE TABLE IF NOT EXISTS contractor_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    state_of_registration TEXT NOT NULL,
    entity_control_number TEXT NOT NULL,
    trades TEXT NOT NULL DEFAULT '[]',
    service_radius_miles INTEGER NOT NULL DEFAULT 50,
    coi_filename TEXT,
    coi_uploaded_at TEXT,
    coi_expires_on TEXT,
    verification_status TEXT NOT NULL DEFAULT 'pending'
      CHECK(verification_status IN ('pending','verified','rejected','expired')),
    verification_notes TEXT,
    verified_at TEXT,
    verified_by INTEGER REFERENCES users(id),
    subscription_status TEXT NOT NULL DEFAULT 'inactive'
      CHECK(subscription_status IN ('inactive','active','past_due','canceled'))
  );

  CREATE TABLE IF NOT EXISTS rfqs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    homeowner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    trade TEXT NOT NULL,
    description TEXT NOT NULL,
    budget_min INTEGER,
    budget_max INTEGER,
    timeline TEXT,
    city TEXT NOT NULL,
    zip TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','awarded','closed')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rfq_id INTEGER NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
    contractor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(rfq_id, contractor_id)
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id INTEGER,
    action TEXT NOT NULL,
    target TEXT,
    detail TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

function logAudit(actorId, action, target, detail) {
  db.prepare(
    `INSERT INTO audit_log (actor_id, action, target, detail) VALUES (?, ?, ?, ?)`
  ).run(actorId ?? null, action, target ?? null, detail ? JSON.stringify(detail) : null);
}

module.exports = { db, logAudit };
