const express = require("express");
const { handleChatbotMessage } = require("../controllers/chatbotController");

const router = express.Router();

// POST /api/chatbot/message — Accessible to all users for FAQ and labor statute queries
router.post("/message", handleChatbotMessage);

module.exports = router;
