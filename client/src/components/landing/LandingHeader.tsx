export type LandingTab = "how-it-works" | "security" | "for-attorneys";

interface LandingHeaderProps {
  activeTab: LandingTab;
  onTabChange: (tab: LandingTab) => void;
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}

const TABS: { id: LandingTab; label: string }[] = [
  { id: "how-it-works", label: "How it works" },
  { id: "security", label: "Security" },
  { id: "for-attorneys", label: "For attorneys" },
];

function LandingHeader({
  activeTab,
  onTabChange,
  onNavigateToLogin,
  onNavigateToRegister,
}: LandingHeaderProps) {
  return (
    <header className="border-b border-hairline bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4 text-parchment-100"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 3l7 3.5v5c0 4.5-3 8.2-7 9.5-4-1.3-7-5-7-9.5v-5L12 3z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="11.5" r="1.6" fill="currentColor" />
            </svg>
          </div>
          <span className="font-display text-base font-semibold text-navy-950">
            Lingkod Batas
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="rounded-lg border border-hairline px-4 py-2 text-sm font-medium text-navy-950 transition-colors hover:bg-parchment-100"
          >
            Log in
          </button>
          <button
            type="button"
            onClick={onNavigateToRegister}
            className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-parchment-100 transition-colors hover:bg-navy-800"
          >
            Sign up
          </button>
        </div>
      </div>

      <nav
        aria-label="Landing page sections"
        className="mx-auto flex max-w-5xl gap-6 px-6"
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              aria-current={isActive ? "page" : undefined}
              className={`border-b-2 pb-3 text-sm transition-colors ${
                isActive
                  ? "border-navy-900 font-semibold text-navy-950"
                  : "border-transparent text-ink-600 hover:text-navy-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}

export default LandingHeader;
