const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const contractRoutes = require("./routes/contractRoutes");
const attorneyRoutes = require("./routes/attorneyRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// Register Mongoose models before any routes run
require("./models/index");

// Core middleware
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
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check — useful once you deploy to Render
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "lingkod-batas-server" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/attorney", attorneyRoutes);

// TODO as sprints progress:
// app.use('/api/analysis', analysisRoutes);     // RAG pipeline / risk analysis
// app.use('/api/knowledge-base', kbRoutes);     // Manage statutory source corpus

// 404 + error handling (must stay last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
