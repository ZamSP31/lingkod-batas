const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const contractRoutes = require("./routes/contractRoutes");

const app = express();

// Register Mongoose models before any routes run
require("./models/index");

// Core middleware
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check — useful once you deploy to Render
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "lingkod-batas-server" });
});

// Routes
app.use("/api/auth", authRoutes);

// TODO as sprints progress:
app.use("/api/contracts", contractRoutes); // Document Ingestion & OCR
// app.use('/api/analysis', analysisRoutes);     // RAG pipeline / risk analysis
// app.use('/api/attorney', attorneyRoutes);     // Attorney dashboard, overrides
// app.use('/api/knowledge-base', kbRoutes);     // Manage statutory source corpus

// 404 + error handling (must stay last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
