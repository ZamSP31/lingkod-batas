import { NavLink } from "react-router-dom";
import BrandMark from "../BrandMark.js";
import { DocumentIcon } from "../shared/icons.js";
import { TrackStatusIcon } from "../client/icons.js";
import { UserCircleIcon, LogOutIcon } from "../attorney/icons.js";
import type { ClientProfile } from "../../types/client.js";

interface ClientSidebarProps {
  client: ClientProfile;
  onLogOut: () => void;
}

const NAV_ITEMS = [
  { to: "/client", label: "My contracts", icon: DocumentIcon, end: true },
  {
    to: "/client/track-status",
    label: "Track Status",
    icon: TrackStatusIcon,
    end: false,
  },
  {
    to: "/client/account",
    label: "Account",
    icon: UserCircleIcon,
    end: false,
  },
] as const;

const navItemClasses = (isActive: boolean) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive
      ? "bg-navy-900 text-parchment-100"
      : "text-ink-600 hover:bg-navy-900/5 hover:text-navy-900"
  }`;

/**
 * The persistent left-hand nav for every client screen (My contracts,
 * Track status, Account). Rendered once by ClientShell so individual
 * pages only need to provide their own main-content body — mirrors
 * AttorneySidebar's structure for the attorney role. Notifications
 * live in the topbar bell (NotificationsMenu), not as a nav item.
 */
function ClientSidebar({ client, onLogOut }: ClientSidebarProps) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-hairline bg-parchment-50 px-4 py-6">
      <div className="px-2">
        <BrandMark size="sm" layout="horizontal" />
      </div>
      <div className="mt-6 flex items-center gap-3 border-y border-hairline px-2 py-4">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-900 text-sm font-semibold text-parchment-100"
          aria-hidden="true"
        >
          {client.initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-900">
            {client.displayName}
          </p>
          <p className="truncate text-xs text-ink-400">{client.role}</p>
        </div>
      </div>
      <nav className="mt-4 flex flex-1 flex-col gap-1" aria-label="Client">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => navItemClasses(isActive)}
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <button
        type="button"
        onClick={onLogOut}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-600 transition-colors hover:bg-navy-900/5 hover:text-navy-900"
      >
        <LogOutIcon className="h-5 w-5" />
        Log out
      </button>
    </aside>
  );
}

export default ClientSidebar;