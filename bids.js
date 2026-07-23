require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { attachUser } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const contractorRoutes = require('./routes/contractor');
const rfqRoutes = require('./routes/rfqs');
const bidRoutes = require('./routes/bids');
const adminRoutes = require('./routes/admin');

const app = express();

// Render/Railway/etc sit behind a reverse proxy — needed for correct
// client IPs (rate limiting) and secure-cookie detection.
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      fontSrc: ["'self'", 'fonts.gstatic.com'],
      // scriptSrc stays locked to same-origin FILES only — an attacker who
      // manages to inject a <script>...</script> tag or a javascript: URL
      // (e.g. via a stored-XSS bug) still can't get it to execute.
      scriptSrc: ["'self'"],
      // The current UI still uses onclick="" / onsubmit="" attributes
      // throughout index.html, which CSP treats as a separate surface from
      // scriptSrc. Allowing it here is a deliberate, narrower trade-off than
      // a blanket 'unsafe-inline' on scriptSrc. TODO before scaling this
      // past an MVP: refactor the onclick attributes to addEventListener
      // with event delegation (see README "Hardening the CSP"), then
      // remove this line entirely for defense-in-depth against XSS.
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';
app.use(cors({ origin: allowedOrigin, credentials: true }));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(attachUser);

// Global request ceiling; auth routes layer a stricter limit on top.
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.use('/api/auth', authRoutes);
app.use('/api/contractor', contractorRoutes);
app.use('/api/rfqs', rfqRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Serve the front-end as static files from the same origin — simplest,
// most secure deploy shape (no cross-origin cookie headaches).
app.use(express.static(path.join(__dirname, '..', 'public')));
app.get('/*splat', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Centralized error handler — never leak stack traces to the client.
app.use((err, req, res, next) => {
  console.error(err);
  if (err.message?.includes('Only PDF')) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Something went wrong on our end.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`TradeBid server listening on :${PORT}`));

module.exports = app;
