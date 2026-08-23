import { NavLink } from "react-router-dom";
import BrandMark from "../BrandMark.js";
import {
  FolderIcon,
  ClipboardCheckIcon,
  BookOpenIcon,
  UserCircleIcon,
  LogOutIcon,
} from "../attorney/icons.js";
import type { AttorneyProfile } from "../../types/attorney.js";

interface AttorneySidebarProps {
  attorney: AttorneyProfile;
  onLogOut: () => void;
}

const NAV_ITEMS = [
  { to: "/attorney", label: "My contracts", icon: FolderIcon, end: true },
  {
    to: "/attorney/review-queue",
    label: "Review queue",
    icon: ClipboardCheckIcon,
    end: false,
  },
  {
    to: "/attorney/statutory-corpus",
    label: "Statutory corpus",
    icon: BookOpenIcon,
    end: false,
  },
  {
    to: "/attorney/account",
    label: "Account",
    icon: UserCircleIcon,
    end: false,
  },
] as const;

/**
 * The persistent left-hand nav for every attorney screen (My contracts,
 * Review queue, Statutory corpus, Account), styled to match the Lingkod Batas
 * deep navy sidebar design.
 */
function AttorneySidebar({ attorney, onLogOut }: AttorneySidebarProps) {
  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col bg-navy-deep px-5 py-[26px] text-parchment">
      {/* Brand Header */}
      <div className="mb-[30px] px-1">
        <BrandMark size="sm" layout="horizontal" theme="dark" />
      </div>

      {/* Attorney Profile Card */}
      <div className="mb-[26px] flex items-center gap-[11px] rounded-[8px] border border-parchment/12 bg-parchment/[0.05] p-[14px]">
        <div
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-gold text-xs font-bold text-navy-deep"
          aria-hidden="true"
        >
          {attorney.initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold leading-[1.3] text-parchment">
            {attorney.displayName}
          </p>
          <p className="truncate font-mono text-[10.5px] text-parchment/50">
            {attorney.rollNumber}
          </p>
        </div>
      </div>

      {/* Navigation items */}
      <nav className="flex flex-1 flex-col gap-0.5" aria-label="Attorney navigation">
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

export default AttorneySidebar;
