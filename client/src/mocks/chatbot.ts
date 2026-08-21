import type { ChatMessage } from "../types/chatbot.js";

export const INITIAL_CHAT_MESSAGE: ChatMessage = {
  id: "msg-0",
  sender: "bot",
  text: 'Hi! I can help with questions about submitting contracts, tracking status, and using the platform. What do you need?',
};

interface CannedReply {
  keywords: string[];
  reply: string;
}

/**
 * Placeholder matcher standing in for a real chatbot backend. Swap
 * getMockBotReply's call site for a real POST /api/chatbot/message
 * once that endpoint exists — this keeps the widget interactive
 * during frontend-only development in the meantime.
 */
const CANNED_REPLIES: CannedReply[] = [
  {
    keywords: ["submit", "upload"],
    reply:
      'Go to "My contracts" and click "Submit contract." You can upload a PDF, PNG, or JPEG — you\'ll get a request number to track its progress.',
  },
  {
    keywords: ["track", "status", "progress", "pipeline"],
    reply:
      'Head to "Track status" in the sidebar to see where your contract is in the review pipeline — from OCR processing through to a completed report.',
  },
  {
    keywords: ["legal", "clause", "risk", "illegal", "terminat"],
    reply:
      "I can't give legal advice on specific clauses — that's the attorney's call as part of the review. I can help you understand how the platform works, though.",
  },
  {
    keywords: ["report", "download", "pdf"],
    reply:
      'Once your contract is marked "Completed," open it from "My contracts" and click "View report." You can download a PDF copy from there.',
  },
];

const FALLBACK_REPLY =
  "I can help with questions about submitting contracts, tracking status, and using the platform. Could you rephrase that?";

export function getMockBotReply(userMessage: string): string {
  const normalized = userMessage.toLowerCase();
  const match = CANNED_REPLIES.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword)),
  );
  return match?.reply ?? FALLBACK_REPLY;
}