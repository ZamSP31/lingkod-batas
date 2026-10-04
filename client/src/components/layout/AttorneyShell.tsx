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
  const { user, logout } = useAuth();

  useEffect(() => {
    if (user && user.role !== "attorney") {
      navigate("/client", { replace: true });
    }
  }, [user, navigate]);

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
