import { Outlet, useNavigate } from "react-router-dom";
import AttorneySidebar from "./AttorneySidebar.js";
import NotificationsMenu from "../shared/NotificationsMenu.js";
import { useAuth } from "../../context/AuthContext.js";
import type { AttorneyProfile } from "../../types/attorney.js";

/**
 * Route-level layout for /attorney/*. Renders the deep navy sidebar once and lets
 * react-router swap the main content via <Outlet />.
 */
function AttorneyShell() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogOut() {
    logout();
    navigate("/login");
  }

  const names = (user?.fullName || "Attorney").split(" ");
  const firstName = names[0] || "Atty.";
  const lastName = names.slice(1).join(" ") || "";

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AT";

  const attorneyProfile: AttorneyProfile = {
    id: user?.id || "",
    firstName,
    lastName,
    fullName: user?.fullName || "Attorney User",
    displayName: user?.fullName
      ? `Atty. ${user.fullName.replace(/^Atty\.\s*/i, "")}`
      : "Atty. Reviewer",
    rollNumber: "IBP No. Verified",
    email: user?.email || "",
    initials,
  };

  return (
    <div className="flex h-screen bg-parchment font-sans text-ink">
      <AttorneySidebar attorney={attorneyProfile} onLogOut={handleLogOut} />
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
