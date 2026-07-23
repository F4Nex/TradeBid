// db/seedAdmin.js
const bcrypt = require('bcryptjs');
const { db } = require('./index');

function createOrPromoteAdmin(email, password, name) {
  email = email.trim().toLowerCase();
  const existing = db.prepare('SELECT id, role FROM users WHERE email = ?').get(email);
  if (existing) {
    if (existing.role !== 'admin') {
      db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(existing.id);
      console.log(`[seed-admin] Existing user ${email} promoted to admin.`);
    } else {
      console.log(`[seed-admin] ${email} is already an admin — nothing to do.`);
    }
    return;
  }
  const hash = bcrypt.hashSync(password, 12);
  db.prepare(
    'INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)'
  ).run(email, hash, 'admin', name);
  console.log(`[seed-admin] Admin account created for ${email}.`);
}

// Called once at server boot. Only runs if all three env vars are set, so
// it's a no-op in normal operation. Handy for hosts (like Render's free
// tier) where you don't reliably get a shell to run the CLI script.
// Safe to leave the env vars set permanently: re-running never resets an
// existing user's password, it only ensures the role is 'admin'.
function seedAdminIfConfigured() {
  const { SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_NAME } = process.env;
  if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD || !SEED_ADMIN_NAME) return;
  if (SEED_ADMIN_PASSWORD.length < 10) {
    console.warn('[seed-admin] SEED_ADMIN_PASSWORD is too short (min 10 chars) — skipping.');
    return;
  }
  try {
    createOrPromoteAdmin(SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_NAME);
  } catch (err) {
    console.error('[seed-admin] Failed:', err.message);
  }
}

module.exports = { createOrPromoteAdmin, seedAdminIfConfigured };
