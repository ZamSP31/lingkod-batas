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
    <div className="flex h-screen bg-parchment font-sans text-ink">
      <ClientSidebar client={clientProfile} onLogOut={handleLogOut} />
      <main className="flex-1 overflow-y-auto px-6 py-6 md:px-11 md:pt-9 md:pb-15">
        <div className="mb-2 flex justify-end">
          <NotificationsMenu />
        </div>
        <Outlet />
      </main>
      <ChatbotWidget />
    </div>
  );
}

export default ClientShell;
