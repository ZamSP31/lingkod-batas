export type LandingTab = "how-it-works" | "security" | "for-attorneys";

interface LandingHeaderProps {
  activeTab?: LandingTab;
  onTabChange?: (tab: LandingTab) => void;
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}

const TABS: { id: LandingTab; label: string; href: string }[] = [
  { id: "how-it-works", label: "How it works", href: "#how" },
  { id: "security", label: "Security", href: "#security" },
  { id: "for-attorneys", label: "For attorneys", href: "#attorneys" },
];

/**
 * Sticky frosted navigation bar for the Lingkod Batas landing page.
 */
function LandingHeader({
  activeTab = "how-it-works",
  onTabChange,
  onNavigateToLogin,
  onNavigateToRegister,
}: LandingHeaderProps) {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-line bg-parchment/90 px-6 py-5 backdrop-blur-md md:px-14">
      {/* Brand */}
      <div className="flex items-center gap-2.5 font-semibold text-[17px] tracking-[-0.01em] text-navy-deep">
        <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[3px] bg-navy">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-4 w-4 text-parchment"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L4 6V12C4 17 7.5 21 12 22C16.5 21 20 17 20 12V6L12 2Z"
              stroke="#F2ECDF"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M9 12L11 14L15 10"
              stroke="#B08D4F"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        Lingkod Batas
      </div>

      {/* Navigation Links */}
      <div className="hidden md:flex items-center gap-9 text-[14.5px] text-ink-soft">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <a
              key={tab.id}
              href={tab.href}
              onClick={(e) => {
                if (onTabChange) {
                  onTabChange(tab.id);
                }
              }}
              className={`relative pb-1 transition-colors hover:text-ink ${
                isActive ? "font-semibold text-ink" : ""
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-maroon" />
              )}
            </a>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onNavigateToLogin}
          className="rounded-[3px] border border-line bg-transparent px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink cursor-pointer"
        >
          Log in
        </button>
        <button
          type="button"
          onClick={onNavigateToRegister}
          className="rounded-[3px] bg-maroon px-5 py-2.5 text-sm font-semibold text-parchment transition-colors hover:bg-maroon-bright cursor-pointer"
        >
          Sign up
        </button>
      </div>
    </nav>
  );
}

export default LandingHeader;
