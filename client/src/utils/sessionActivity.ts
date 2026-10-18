export const IDLE_TIMEOUT_MS = 60 * 60 * 1000;
const ACTIVITY_KEY = "lb_session_activity";

export function watchSessionActivity({ token, onExpired, heartbeat,
  storage = localStorage, events = window, clock = Date.now,
}: { token: string; onExpired: () => void; heartbeat: () => Promise<void>;
  storage?: Storage; events?: Window; clock?: () => number }) {
  let stopped = false;
  let lastSent = -Infinity;
  let sending = false;
  let lastPersisted = -Infinity;
  let lastActivity = clock();
  function read() {
    try {
      const saved = JSON.parse(storage.getItem(ACTIVITY_KEY) || "null");
      if (saved?.token === token && Number.isFinite(saved.at)) lastActivity = Math.max(lastActivity, saved.at);
    } catch { /* In-memory timeout still applies when browser storage is unavailable. */ }
  }
  try {
    const saved = JSON.parse(storage.getItem(ACTIVITY_KEY) || "null");
    if (saved?.token === token && Number.isFinite(saved.at)) lastActivity = saved.at;
  } catch { /* Use the current session's initial activity time. */ }
  function persist() {
    if (clock() - lastPersisted < 5000) return;
    lastPersisted = clock();
    try { storage.setItem(ACTIVITY_KEY, JSON.stringify({ token, at: lastActivity })); } catch { /* Keep the in-memory deadline. */ }
  }
  function check() {
    if (stopped) return false;
    read();
    if (clock() - lastActivity >= IDLE_TIMEOUT_MS) {
      stopped = true;
      onExpired();
      return false;
    }
    return true;
  }
  function send() {
    if (sending || clock() - lastSent < 30_000) return;
    sending = true;
    lastSent = clock();
    void heartbeat().catch(() => {}).finally(() => { sending = false; });
  }
  function activity(event: Event) {
    if (!check() || event.isTrusted === false) return;
    lastActivity = clock();
    persist();
    send();
  }
  const names = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart"];
  if (check()) { persist(); send(); }
  names.forEach(name => events.addEventListener(name, activity, { passive: true }));
  events.addEventListener("focus", check);
  events.addEventListener("storage", check);
  const timer = events.setInterval(check, 1000);
  return () => {
    stopped = true;
    events.clearInterval(timer);
    names.forEach(name => events.removeEventListener(name, activity));
    events.removeEventListener("focus", check);
    events.removeEventListener("storage", check);
  };
}
