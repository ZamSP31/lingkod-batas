import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { ChatMessage } from "../../types/chatbot.js";
import { INITIAL_CHAT_MESSAGE, getMockBotReply } from "../../mocks/chatbot.js";

/**
 * Floating assistant chatbot matching Screen 10 of the mockup.
 */
function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_CHAT_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  function handleSend(event: FormEvent) {
    event.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: "user",
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    window.setTimeout(() => {
      const botMessage: ChatMessage = {
        id: `msg-${Date.now()}-bot`,
        sender: "bot",
        text: getMockBotReply(trimmed),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 400);
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open assistant"
        className="fixed bottom-7 right-7 z-50 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-navy-deep text-parchment shadow-xl transition-transform hover:scale-105 cursor-pointer"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          className="h-[22px] w-[22px]"
        >
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" strokeLinecap="round" />
          <path d="M6.5 2H20V22H6.5A2.5 2.5 0 014 19.5V4.5A2.5 2.5 0 016.5 2Z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-[92px] right-7 z-50 flex w-[340px] flex-col overflow-hidden rounded-[10px] border border-line bg-white shadow-2xl">
      {/* Head */}
      <div className="flex items-center justify-between bg-navy-deep p-4 text-parchment">
        <div className="flex items-center gap-3">
          <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-parchment/20 bg-parchment/10 text-gold">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className="h-4 w-4"
            >
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" strokeLinecap="round" />
              <path d="M6.5 2H20V22H6.5A2.5 2.5 0 014 19.5V4.5A2.5 2.5 0 016.5 2Z" />
            </svg>
          </div>
          <div>
            <div className="text-[13.5px] font-semibold">
              Lingkod Batas Assistant
            </div>
            <div className="font-mono text-[9.5px] tracking-[0.04em] text-parchment/55 uppercase">
              Platform help only — not legal advice
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-parchment/60 hover:text-parchment cursor-pointer p-1"
          aria-label="Close assistant"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex max-h-[300px] min-h-[140px] flex-col gap-2.5 overflow-y-auto p-4 bg-white">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`rounded-[8px] p-3 text-[13px] leading-[1.55] ${
              message.sender === "user"
                ? "self-end bg-navy text-parchment ml-6"
                : "self-start bg-parchment text-ink mr-6"
            }`}
          >
            {message.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex gap-2 border-t border-line bg-white p-3.5"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask a question…"
          className="flex-1 rounded-[6px] border border-line bg-parchment px-3 py-2 text-[13px] text-ink placeholder:text-ink-soft/70 focus:border-navy focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-maroon text-parchment transition-colors hover:bg-maroon-bright disabled:opacity-40 cursor-pointer"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-3.5 w-3.5"
          >
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
        </button>
      </form>
    </div>
  );
}

export default ChatbotWidget;