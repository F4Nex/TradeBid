{
  "name": "tradebid-server",
  "version": "1.0.0",
  "description": "TradeBid backend — RFQ marketplace API with contractor LLC/insurance verification",
  "main": "server.js",
  "engines": { "node": ">=22.5.0" },
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js",
    "seed:admin": "node scripts/seed-admin.js"
  },
  "keywords": [],
  "author": "",
  "license": "UNLICENSED",
  "dependencies": {
    "bcryptjs": "^3.0.3",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.6",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "express-rate-limit": "^8.6.0",
    "helmet": "^8.3.0",
    "jsonwebtoken": "^9.0.3",
    "multer": "^2.2.0",
    "zod": "^4.4.3"
  }
}
