import { Outlet, useNavigate } from "react-router-dom";
import ClientSidebar from "./ClientSidebar.js";
import NotificationsMenu from "../shared/NotificationsMenu.js";
import { mockCurrentClient } from "../../mocks/client.js";
import ChatbotWidget from "../client/ChatbotWidget.js";

/**
 * Route-level layout for /client/*. Renders the deep navy sidebar once and swaps
 * content via <Outlet /> for client views.
 */
function ClientShell() {
  const navigate = useNavigate();

  function handleLogOut() {
    navigate("/");
  }

  return (
    <div className="flex h-screen bg-parchment font-sans text-ink">
      <ClientSidebar client={mockCurrentClient} onLogOut={handleLogOut} />
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