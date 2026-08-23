import { Outlet, useNavigate } from "react-router-dom";
import AttorneySidebar from "./AttorneySidebar.js";
import NotificationsMenu from "../shared/NotificationsMenu.js";
import { mockCurrentAttorney } from "../../mocks/attorney.js";

/**
 * Route-level layout for /attorney/*. Renders the deep navy sidebar once and lets
 * react-router swap the main content via <Outlet />.
 */
function AttorneyShell() {
  const navigate = useNavigate();

  function handleLogOut() {
    // TODO: wire to the Logout confirmation modal (Fig. 3.36) and the
    // real sign-out call once auth exists. For now, just return to landing.
    navigate("/");
  }

  return (
    <div className="flex h-screen bg-parchment font-sans text-ink">
      <AttorneySidebar attorney={mockCurrentAttorney} onLogOut={handleLogOut} />
      <main className="flex-1 overflow-y-auto px-6 py-6 md:px-11 md:pt-9 md:pb-11">
        <div className="mb-2 flex justify-end">
          <NotificationsMenu />
        </div>
        <Outlet />
      </main>
    </div>
  );
}

export default AttorneyShell;