import { Outlet, useNavigate } from "react-router-dom";
import ClientSidebar from "./ClientSidebar.js";
import NotificationsMenu from "../shared/NotificationsMenu.js";
import { mockCurrentClient } from "../../mocks/client.js";
import ChatbotWidget from "../client/ChatbotWidget.js"; // adjust relative path to match your file's location

/**
 * Route-level layout for /client/*. Renders the sidebar once and lets
 * react-router swap the main content via <Outlet /> as the client
 * moves between My contracts, Track status, and Account — mirrors
 * AttorneyShell for the attorney role. NotificationsMenu in the topbar
 * covers notifications, matching the attorney dashboard's pattern.
 *
 * `client` is hardcoded to the mock profile for now; once auth exists,
 * swap this for the profile out of an auth/session context.
 */
function ClientShell() {
  const navigate = useNavigate();

  function handleLogOut() {
    navigate("/");
  }

  return (
    <div className="flex h-screen bg-parchment-100">
      <ClientSidebar client={mockCurrentClient} onLogOut={handleLogOut} />
      <main className="flex-1 overflow-y-auto">
        <div className="flex justify-end border-b border-hairline px-8 py-3">
          <NotificationsMenu />
        </div>
        <div className="mx-auto max-w-6xl px-8 py-8">
          <Outlet />
        </div>
      </main>
      <ChatbotWidget />
    </div>
  );
}

export default ClientShell;