# Copy this file to .env and fill in real values. Never commit .env.

# Generate with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_SECRET=

# The exact origin your frontend is served from (no trailing slash).
# This MUST match exactly, or same-origin form submissions (signup, login,
# posting jobs, bidding) will be rejected as cross-site requests.
ALLOWED_ORIGIN=http://localhost:3000

NODE_ENV=development
PORT=3000

# Optional: automatically create/promote an admin account on server boot.
# Useful on hosts where you don't have reliable shell access (e.g. Render's
# free tier). Safe to leave set permanently — see db/seedAdmin.js.
SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
SEED_ADMIN_NAME=
