import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AttorneySidebar from "./AttorneySidebar.js";
import NotificationsMenu from "../shared/NotificationsMenu.js";
import { useAuth } from "../../context/AuthContext.js";
import ChatbotWidget from "../client/ChatbotWidget.js";
import type { AttorneyProfile } from "../../types/attorney.js";

/**
 * Route-level layout for /attorney/*. Renders the deep navy sidebar once, top notifications,
 * floating legal assistant chatbot, and lets react-router swap content via <Outlet />.
 */
function AttorneyShell() {
  const navigate = useNavigate();
  const { user, isLoading, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (user.role !== "attorney") {
      navigate("/client", { replace: true });
    }
  }, [user, isLoading, navigate]);

  function handleLogOut() {
    logout();
    navigate("/login");
  }

  const fullName = user?.fullName || "Attorney";
  const nameParts = fullName.replace(/^Atty\.\s*/i, "").trim().split(/\s+/);

  const displayName = fullName.startsWith("Atty.")
    ? fullName
    : `Atty. ${fullName}`;

  const attorneyProfile: AttorneyProfile = {
    id: user?.id || "",
    firstName: nameParts[0] || "",
    lastName: nameParts.slice(1).join(" "),
    fullName,
    displayName,
    rollNumber: user?.rollNumber || "Not provided",
    email: user?.email || "",
    initials: nameParts.filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase(),
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-parchment font-sans text-navy-deep">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-deep border-t-transparent" />
          <span className="font-mono text-xs text-ink-soft">Verifying credentials…</span>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "attorney") {
    return null;
  }

  return (
    <div className="flex h-dvh min-w-0 bg-parchment font-sans text-ink print:h-auto print:bg-white print:block">
      <div className="hidden md:block print:hidden">
        <AttorneySidebar attorney={attorneyProfile} onLogOut={handleLogOut} />
      </div>
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden print:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-navy-deep/50"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative h-full w-[260px] max-w-[85vw] shadow-2xl">
            <AttorneySidebar attorney={attorneyProfile} onLogOut={handleLogOut} />
          </div>
        </div>
      )}
      <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-6 md:px-11 md:pt-9 md:pb-15 print:overflow-visible print:p-0 print:m-0 print:w-full print:block">
        <div className="relative z-30 mb-2 flex items-center justify-between print:hidden">
          <button
            type="button"
            aria-label="Open navigation"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-navy-deep shadow-xs md:hidden"
            onClick={() => setMobileNavOpen(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              <path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <NotificationsMenu />
        </div>
        <Outlet />
      </main>
      <div className="print:hidden">
        <ChatbotWidget />
      </div>
    </div>
  );
}

export default AttorneyShell;
