import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { ChatMessage } from "../../types/chatbot.js";
import { INITIAL_CHAT_MESSAGE, getMockBotReply } from "../../mocks/chatbot.js";

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path
        d="M3 9.5c0-3.59 3.13-6.5 7-6.5s7 2.91 7 6.5-3.13 6.5-7 6.5c-.86 0-1.68-.12-2.44-.35L4 17l1.06-3.18C3.77 12.7 3 11.17 3 9.5Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path
        d="m5 5 10 10M15 5 5 15"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path
        d="M17 3 3 9.5l6 2.3M17 3l-5.7 14-2.3-5.2M17 3 9.3 11.3"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The floating chatbot, mounted once by ClientShell so it persists
 * across every /client/* page. Collapsed state is a single round FAB;
 * expanded state is a message panel anchored to the same corner.
 * Client-only — do not mount this in AttorneyShell.
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

    // TODO: replace with a real POST /api/chatbot/message call once
    // that endpoint exists. The setTimeout mimics network latency so
    // the panel doesn't feel instantaneous/fake during frontend dev.
    window.setTimeout(() => {
      const botMessage: ChatMessage = {
        id: `msg-${Date.now()}-bot`,
        sender: "bot",
        text: getMockBotReply(trimmed),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 500);
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open chat assistant"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-navy-900 text-white shadow-lg hover:bg-navy-900/90"
      >
        <ChatBubbleIcon className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[32rem] w-80 flex-col overflow-hidden rounded-2xl border border-hairline bg-white shadow-lg sm:w-96">
      <div className="flex items-center gap-3 bg-navy-900 px-4 py-3 text-white">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
          <ChatBubbleIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            Lingkod Batas Assistant
          </p>
          <p className="truncate text-xs text-white/70">
            Platform help only — not legal advice
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close chat assistant"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto bg-parchment-50 px-4 py-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
              message.sender === "user"
                ? "self-end rounded-br-sm bg-navy-900 text-white"
                : "self-start rounded-bl-sm border border-hairline bg-white text-ink-900"
            }`}
          >
            {message.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-hairline bg-white p-3"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder="Ask a question..."
          className="flex-1 rounded-lg border border-hairline px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-navy-900 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputValue.trim()}
          aria-label="Send message"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-900 text-white disabled:opacity-40"
        >
          <SendIcon className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

export default ChatbotWidget;