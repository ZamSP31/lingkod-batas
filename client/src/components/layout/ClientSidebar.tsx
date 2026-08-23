import { NavLink } from "react-router-dom";
import BrandMark from "../BrandMark.js";
import { FolderIcon, UserCircleIcon, LogOutIcon } from "../attorney/icons.js";
import type { ClientProfile } from "../../types/client.js";

interface ClientSidebarProps {
  client: ClientProfile;
  onLogOut: () => void;
}

const NAV_ITEMS = [
  { to: "/client", label: "My contracts", icon: FolderIcon, end: true },
  {
    to: "/client/track-status",
    label: "Track status",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 7V12L15 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    end: false,
  },
  {
    to: "/client/account",
    label: "Account",
    icon: UserCircleIcon,
    end: false,
  },
] as const;

/**
 * Client portal persistent sidebar matching the deep navy layout from Lingkod Batas mockups.
 */
function ClientSidebar({ client, onLogOut }: ClientSidebarProps) {
  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col bg-navy-deep px-5 py-[26px] text-parchment">
      {/* Brand Header */}
      <div className="mb-[30px] px-1">
        <BrandMark size="sm" layout="horizontal" theme="dark" />
      </div>

      {/* Client Profile Card */}
      <div className="mb-[26px] flex items-center gap-[11px] rounded-[8px] border border-parchment/12 bg-parchment/[0.05] p-[14px]">
        <div
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-gold text-xs font-bold text-navy-deep"
          aria-hidden="true"
        >
          {client.initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold leading-[1.3] text-parchment">
            {client.displayName}
          </p>
          <p className="truncate font-mono text-[10.5px] text-parchment/50">
            {client.role}
          </p>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex flex-1 flex-col gap-0.5" aria-label="Client navigation">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-[11px] rounded-[6px] px-3 py-2.5 text-[13.5px] transition-colors ${
                isActive
                  ? "bg-maroon font-semibold text-parchment shadow-xs"
                  : "text-parchment/65 hover:bg-parchment/[0.05] hover:text-parchment"
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Navigation */}
      <div className="mt-3.5 border-t border-parchment/10 pt-3.5">
        <button
          type="button"
          onClick={onLogOut}
          className="flex w-full items-center gap-[11px] rounded-[6px] px-3 py-2 text-[13.5px] text-parchment/45 transition-colors hover:bg-parchment/[0.05] hover:text-parchment cursor-pointer"
        >
          <LogOutIcon className="h-4 w-4 shrink-0" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}

export default ClientSidebar;