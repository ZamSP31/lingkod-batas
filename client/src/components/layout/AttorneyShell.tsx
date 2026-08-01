import { Outlet, useNavigate } from "react-router-dom";
import AttorneySidebar from "./AttorneySidebar.js";
import { mockCurrentAttorney } from "../../mocks/attorney.js";

/**
 * Route-level layout for /attorney/*. Renders the sidebar once and lets
 * react-router swap the main content via <Outlet /> as the attorney
 * moves between My contracts, Review queue, Statutory corpus, and
 * Account — avoiding a full sidebar remount on every navigation.
 *
 * `attorney` is hardcoded to the mock profile for now; once auth exists,
 * swap this for the profile out of an auth/session context.
 */
function AttorneyShell() {
  const navigate = useNavigate();

  function handleLogOut() {
    // TODO: wire to the Logout confirmation modal (Fig. 3.36) and the
    // real sign-out call once auth exists. For now, just return to landing.
    navigate("/");
  }

  return (
    <div className="flex h-screen bg-parchment-100">
      <AttorneySidebar attorney={mockCurrentAttorney} onLogOut={handleLogOut} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AttorneyShell;
