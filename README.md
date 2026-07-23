# TradeBid

An RFQ marketplace connecting homeowners with LLC-verified, insured contractors.
Free for homeowners; flat-rate subscription for contractors. No lead fees.

This is a real, working full-stack app: Express backend with authentication,
a SQLite database, an LLC/insurance verification review queue, and a
mobile-friendly, installable (PWA) frontend. It is NOT connected to a live
payment processor yet — see "Before you take real money" below.

## Project structure

```
tradebid/
  server/            Node/Express API (auth, RFQs, bids, verification, admin)
    db/              Database schema + connection (Node's built-in sqlite)
    routes/          auth.js, rfqs.js, bids.js, contractor.js, admin.js
    middleware/       auth.js (JWT sessions, role guards, CSRF check)
    scripts/          seed-admin.js — creates your first staff login
    uploads/          Contractor COI PDFs land here (git-ignored)
    server.js         App entry point, security middleware, static hosting
  public/            The frontend — served by the same Express app
    index.html        Single-page app shell
    app.js             All frontend logic (kept as a separate file — see
                       "Why app.js is separate" below)
    manifest.json      PWA manifest (home-screen install)
    service-worker.js  Offline app-shell caching
    icons/             Generated app icons, all standard sizes
```

## Running it locally

```bash
cd server
npm install
cp .env.example .env
# Generate a real secret and paste it into .env as JWT_SECRET:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
npm start
```

Visit http://localhost:3000 — the frontend and API are served from the same
Express app, so there's nothing else to run.

Create your first staff (admin) login so you can review contractor
verifications:

```bash
node scripts/seed-admin.js you@yourcompany.com "a-strong-password" "Your Name"
```

Log in with that account and go to the "Admin Queue" link in the nav.

## Deploying to Render (free tier — a real working demo in ~10 minutes)

This gets you a live URL with working signup, login, RFQ posting, and the
admin verification queue — not just a static preview.

1. **Push this to GitHub** if you haven't already (the whole `tradebid/`
   folder, including `server/` and `public/`).

2. **Create a Render account** at render.com (GitHub sign-in is easiest —
   it can then see your repos directly).

3. **New → Web Service** → connect the repo.

4. **Configure the service:**
   - **Name**: pick something — this becomes part of your URL:
     `https://<name>.onrender.com`. Note it down, you need it in step 5.
   - **Root Directory**: `tradebid/server`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

5. **Add environment variables** (Render's "Environment" tab — add these
   *before* the first deploy if you can, or add them after and it'll
   auto-redeploy):

   | Key | Value |
   |---|---|
   | `JWT_SECRET` | a random string — generate one locally: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
   | `ALLOWED_ORIGIN` | `https://<name>.onrender.com` — **the exact URL from step 4, no trailing slash.** Getting this wrong makes every signup/login/post fail with "Cross-site request blocked." |
   | `NODE_ENV` | `production` |
   | `SEED_ADMIN_EMAIL` | your email, to create your staff login |
   | `SEED_ADMIN_PASSWORD` | a real password, 10+ characters |
   | `SEED_ADMIN_NAME` | your name |

6. **Create Web Service.** Render builds and deploys (2–5 minutes on the
   free tier). Watch the deploy log for `TradeBid server listening on :...`
   and `[seed-admin] Admin account created for ...` — that second line
   confirms your staff login is ready.

7. Visit `https://<name>.onrender.com`. Try signing up as a homeowner,
   post a test job, then log in with your `SEED_ADMIN_EMAIL` /
   `SEED_ADMIN_PASSWORD` and open **Admin Queue** in the nav.

### Two honest limits of Render's free tier

- **It sleeps.** After ~15 minutes with no traffic, the free instance spins
  down. The next visit takes 30–50 seconds to "wake up" — normal for a demo,
  worth knowing before you screen-share it live.
- **Storage isn't persistent.** The free tier's disk resets on every
  redeploy (and sometimes on restart), which means your SQLite database and
  any uploaded COI PDFs can disappear. Fine for a demo; before a real
  launch, either upgrade to a paid Render plan with a persistent disk, or
  move to Render's free managed Postgres and swap the `db/` layer (see
  "Growing past SQLite" below) — Postgres storage there is durable.

### Growing past SQLite

The built-in `node:sqlite` module is genuinely fine for a while — it's a
single file, handles real concurrent traffic reasonably, and needs zero
setup. When you outgrow it (multiple server instances, heavier write
volume), the migration path is Postgres: the queries in `db/index.js` and
the route files use plain SQL with `?` placeholders, so moving to
`pg`/`postgres.js` is a rewrite of one file, not an architecture change.

## Mobile support

The frontend is fully responsive (phone/tablet/desktop) and installable as
a home-screen app on both iOS and Android:

- **Responsive layout** — breakpoints at 860px, 700px, and 420px; a proper
  hamburger menu replaces the top nav below 700px; touch targets are sized
  to Apple/Google's 44px minimum; form inputs are 16px to stop iOS Safari's
  auto-zoom-on-focus.
- **Installable (PWA)** — `manifest.json` + a full icon set + a service
  worker mean visitors can tap "Add to Home Screen" (iOS Safari) or get an
  install prompt (Android Chrome) and it opens full-screen, like a native
  app, with your icon.
- **Offline shell** — the service worker caches the app shell (HTML/CSS/JS/
  icons) so the app still opens with a spinner instead of a browser error
  when someone's signal drops. It deliberately never caches `/api/*` —
  job data, bids, and auth must always be fetched fresh.
- **This is a mobile web app, not a native app.** It works great in Safari/
  Chrome on a phone and can be "installed" from the browser. It is not a
  React Native / Flutter app and won't appear in the App Store or Play
  Store. If you want a true native app later, this backend's API (`/api/*`)
  is what a native app would talk to — no backend changes needed, only a
  new native frontend.

### Why app.js is separate

The frontend's JavaScript lives in `public/app.js` rather than inline in
`index.html`. This is a security requirement, not a style choice: the
server sends a strict Content-Security-Policy header (`script-src 'self'`),
which blocks inline `<script>` blocks by design — it's what stops an
injected `<script>` tag (e.g. from a stored-XSS bug) from ever executing.
Keeping the real app logic in an external same-origin file satisfies that
policy without weakening it.

### Hardening the CSP further

The UI still uses `onclick="..."` / `onsubmit="..."` attributes throughout
`index.html` for simplicity. CSP treats these as a separate surface
(`script-src-attr`) from `<script>` tags, and `server.js` currently allows
it explicitly (`scriptSrcAttr: ["'unsafe-inline'"]`) with a comment marking
it as a known trade-off. To close this gap entirely: replace the `onclick`
attributes with `addEventListener` calls (event delegation on `document`
works well given how much of the UI is dynamically rendered), then delete
the `scriptSrcAttr` line in `server.js`. Worth doing before this handles
real payment or sensitive data at scale.

## Before you take real money

- **Payments**: `POST /api/admin/subscription/:userId/activate` is a manual
  stand-in. Wire up Stripe Billing and flip that flag from a Stripe webhook
  (`checkout.session.completed`, `customer.subscription.updated/.deleted`)
  instead of a manual admin click.
- **Email**: there's no email sending yet (bid notifications, verification
  decisions). Add a transactional email provider (Postmark, Resend, SES) and
  call it from the relevant route handlers.
- **Legal**: the Terms of Service and Privacy Policy pages are drafted
  starting points, clearly marked `[date]` and needing review — have an
  attorney look at them, especially the liability and verification language,
  before you launch.
- **LLC verification stays human-reviewed by design** — see the comment
  block at the top of `routes/admin.js` for why, and how to layer a paid
  business-verification API (e.g. Middesk) on top later without removing
  the human check on the insurance PDF.
