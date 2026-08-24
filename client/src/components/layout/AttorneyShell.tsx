import { useEffect } from "react";
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

  useEffect(() => {
    if (user && user.role !== "attorney") {
      navigate("/client", { replace: true });
    }
  }, [user, navigate]);

  function handleLogOut() {
    logout();
    navigate("/login");
  }

  const rawName = user?.fullName || "Atty. Jimenez";
  const fullName =
    rawName === "Juan Dela Cruz" || rawName === "Attorney User"
      ? "Atty. Jimenez"
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
    initials: "AJ",
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
