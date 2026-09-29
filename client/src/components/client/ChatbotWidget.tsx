import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { ChatMessage } from "../../types/chatbot.js";
import { INITIAL_CHAT_MESSAGE, getMockBotReply } from "../../mocks/chatbot.js";

import { BASE_URL } from "../../services/apiConfig.js";

const STARTER_PROMPTS = [
  "Platform walkthrough",
  "How to upload a contract",
  "Track review status",
  "Data privacy & RA 10173",
  "Supported contract types",
  "Salary deduction rules",
];

/**
 * Modern floating assistant matching industry standards (LegalTech / Intercom style).
 * Grounded in Philippine Labor Statutes with Rule 6 Intent Guardrails.
 */
function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    INITIAL_CHAT_MESSAGE,
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, isTyping]);

  async function dispatchMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: "user",
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const res = await fetch(`${BASE_URL}/api/chatbot/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok) throw new Error("Chatbot API response failed");
      const data = (await res.json()) as { reply?: string };

      const botMessage: ChatMessage = {
        id: `msg-${Date.now()}-bot`,
        sender: "bot",
        text: data.reply || getMockBotReply(trimmed),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch {
      // Graceful fallback to client-side answers if offline
      const botMessage: ChatMessage = {
        id: `msg-${Date.now()}-bot`,
        sender: "bot",
        text: getMockBotReply(trimmed),
      };
      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setIsTyping(false);
    }
  }

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    await dispatchMessage(inputValue);
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open assistant"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-navy-deep text-parchment shadow-xl ring-4 ring-navy-deep/15 transition-all duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer group"
      >
        <span className="absolute top-0 right-0 block h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6 text-gold transition-transform group-hover:scale-110"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex w-[370px] sm:w-[390px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl ring-1 ring-black/5">
      {/* Header */}
      <div className="flex items-center justify-between bg-navy-deep px-4 py-3.5 text-white">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 text-gold">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4.5 w-4.5"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span className="absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-navy-deep" />
          </div>
          <div>
            <div className="text-[13.5px] font-semibold tracking-tight text-white">
              Lingkod Batas Assistant
            </div>
            <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-slate-300">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Statutory &amp; Platform Guidance
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          aria-label="Close assistant"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex max-h-[380px] min-h-[220px] flex-col gap-3 overflow-y-auto p-4 bg-slate-50/60">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`whitespace-pre-line text-[13px] leading-relaxed ${
              message.sender === "user"
                ? "self-end max-w-[85%] rounded-2xl rounded-tr-xs bg-navy text-white px-3.5 py-2.5 shadow-xs"
                : "self-start max-w-[88%] rounded-2xl rounded-tl-xs bg-white border border-slate-200/80 px-3.5 py-2.5 text-slate-800 shadow-2xs"
            }`}
          >
            {message.text}
          </div>
        ))}

        {messages.length <= 1 && (
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Suggested topics
            </span>
            <div className="flex flex-wrap gap-1.5">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => dispatchMessage(prompt)}
                  className="group flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-[11.5px] font-medium text-slate-700 shadow-2xs hover:border-navy hover:bg-slate-50 hover:text-navy transition-all cursor-pointer"
                >
                  <span className="h-1 w-1 rounded-full bg-slate-400 transition-colors group-hover:bg-navy" />
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {isTyping && (
          <div className="self-start flex items-center gap-1.5 rounded-2xl rounded-tl-xs bg-white border border-slate-200/80 px-3.5 py-2.5 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
            <span className="ml-1 text-[11px] text-slate-400 font-medium">
              Consulting Labor Code provisions…
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-slate-200/80 bg-white p-3"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask a question or topic…"
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-navy focus:bg-white focus:outline-none focus:ring-1 focus:ring-navy/20 transition-all"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isTyping}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy text-white transition-all hover:bg-navy-light disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-xs"
          aria-label="Send message"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>

      {/* Micro Disclaimer Footer */}
      <div className="border-t border-slate-100 bg-slate-50/80 px-3 py-1.5 text-center text-[10px] text-slate-400">
        Informational assistance only · Not legal counsel
      </div>
    </div>
  );
}

export default ChatbotWidget;
