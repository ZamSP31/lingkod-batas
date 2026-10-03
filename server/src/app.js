const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const contractRoutes = require("./routes/contractRoutes");
const attorneyRoutes = require("./routes/attorneyRoutes");
const kbRoutes = require("./routes/kbRoutes");
const auditRoutes = require("./routes/auditRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// Register Mongoose models before any routes run
require("./models/index");

// 1. HTTP Security Headers (OWASP A05:2021)
app.use(
  helmet({
    contentSecurityPolicy: false, // API server; client is served independently
    crossOriginEmbedderPolicy: false,
  }),
);
app.disable("x-powered-by");

// 2. Strict Payload Limits (Denial-of-Service mitigation)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// 3. CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // In development or local testing, allow loopback and LAN origins
      if (process.env.NODE_ENV !== "production") {
        const isAllowedLocal =
          /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(
            origin,
          );
        if (allowedOrigins.includes(origin) || isAllowedLocal) {
          return callback(null, true);
        }
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  }),
);

// 4. Rate Limiters (OWASP A04:2021 & CWE-307)
// Sensitive authentication endpoints: max 30 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many authentication attempts. Please try again after 15 minutes.",
  },
});

// Chatbot interactions: max 60 requests per 10 minutes
const chatbotLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Chatbot rate limit reached. Please wait a moment before sending another query.",
  },
});

// Contract upload requests: max 25 uploads per hour
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Contract upload limit reached for this hour. Please try again later.",
  },
});

// Health check — useful for Render or container orchestration
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "lingkod-batas-server" });
});

// Routes with applied rate limiting
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/contracts", uploadLimiter, contractRoutes);
app.use("/api/attorney", attorneyRoutes);
app.use("/api/knowledge-base", kbRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chatbot", chatbotLimiter, chatbotRoutes);

// 404 + central error handling (must stay last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
