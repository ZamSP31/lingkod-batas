import { useEffect } from "react";
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

  const rawName = user?.fullName || "Atty. Danielito Jimenez";
  const fullName =
    rawName === "Juan Dela Cruz" || rawName === "Attorney User"
      ? "Atty. Danielito Jimenez"
      : rawName;

  const displayName = fullName.startsWith("Atty.")
    ? fullName
    : `Atty. ${fullName}`;

  const attorneyProfile: AttorneyProfile = {
    id: user?.id || "",
    firstName: "Atty.",
    lastName: "Jimenez",
    fullName,
    displayName,
    rollNumber: "IBP Roll No. 67890",
    email: user?.email || "attorney@lingkodbatas.ph",
    initials: "DJ",
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
    <div className="flex h-screen bg-parchment font-sans text-ink print:h-auto print:bg-white print:block">
      <div className="print:hidden">
        <AttorneySidebar attorney={attorneyProfile} onLogOut={handleLogOut} />
      </div>
      <main className="flex-1 overflow-y-auto px-6 py-6 md:px-11 md:pt-9 md:pb-15 print:overflow-visible print:p-0 print:m-0 print:w-full print:block">
        <div className="relative z-30 mb-2 flex justify-end print:hidden">
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
