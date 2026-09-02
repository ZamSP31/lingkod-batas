import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import ClientSidebar from "./ClientSidebar.js";
import NotificationsMenu from "../shared/NotificationsMenu.js";
import { useAuth } from "../../context/AuthContext.js";
import ChatbotWidget from "../client/ChatbotWidget.js";

/**
 * Route-level layout for /client/*. Renders the deep navy sidebar once and swaps
 * content via <Outlet /> for client views.
 */
function ClientShell() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (user && user.role === "attorney") {
      navigate("/attorney", { replace: true });
    }
  }, [user, navigate]);

  function handleLogOut() {
    logout();
    navigate("/login");
  }

  const names = (user?.fullName || "Client User").split(" ");
  const firstName = names[0] || "Client";
  const lastName = names.slice(1).join(" ") || "";

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "CL";

  const clientProfile = {
    id: user?.id || "",
    firstName,
    lastName,
    fullName: user?.fullName || "Client User",
    displayName: user?.fullName || "Client User",
    role: "Client",
    email: user?.email || "",
    contactNumber: "",
    initials,
  };

  return (
    <div className="flex h-screen bg-parchment font-sans text-ink print:h-auto print:bg-white print:block">
      <div className="print:hidden">
        <ClientSidebar client={clientProfile} onLogOut={handleLogOut} />
      </div>
      <main className="flex-1 overflow-y-auto px-6 py-6 md:px-11 md:pt-9 md:pb-15 print:overflow-visible print:p-0 print:m-0 print:w-full print:block">
        <div className="mb-2 flex justify-end print:hidden">
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

export default ClientShell;
