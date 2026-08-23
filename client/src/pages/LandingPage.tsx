import { useState } from "react";
import LandingHeader from "../components/landing/LandingHeader.js";
import LandingFooter from "../components/landing/LandingFooter.js";
import type { LandingTab } from "../components/landing/LandingHeader.js";

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}

/**
 * Lingkod Batas marketing & product homepage matching Screen 4 of the mockups.
 */
function LandingPage({
  onNavigateToLogin,
  onNavigateToRegister,
}: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<LandingTab>("how-it-works");

  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  function handleTabChange(tab: LandingTab) {
    setActiveTab(tab);
    if (tab === "how-it-works") scrollToSection("how");
    if (tab === "security") scrollToSection("security");
    if (tab === "for-attorneys") scrollToSection("attorneys");
  }

  return (
    <div className="flex min-h-screen flex-col bg-parchment font-sans text-ink">
      {/* Sticky Navigation */}
      <LandingHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onNavigateToLogin={onNavigateToLogin}
        onNavigateToRegister={onNavigateToRegister}
      />

      <main className="flex-1">
        {/* ===== HERO SECTION ===== */}
        <section className="mx-auto grid max-w-[1360px] grid-cols-1 items-center gap-12 px-6 py-14 md:grid-cols-[1.05fr_0.95fr] md:gap-16 md:px-14 md:py-24">
          <div className="flex flex-col">
            <div className="mb-5.5 flex items-center gap-2.5 font-mono text-xs font-medium tracking-[0.08em] text-maroon uppercase">
              <span className="h-[1px] w-[22px] bg-maroon" />
              For Philippine solo & freelance counsel
            </div>

            <h1 className="mb-6 font-serif text-[40px] font-medium leading-[1.06] tracking-[-0.015em] text-navy-deep sm:text-[52px]">
              Every clause reviewed.<br />
              Every judgment still <em className="font-serif italic text-maroon font-medium">yours</em>.
            </h1>

            <p className="mb-9 max-w-[460px] text-[17.5px] leading-[1.6] text-ink-soft">
              Lingkod Batas reads contracts against the Labor Code and DOLE issuances, flags what deserves a second look, and puts it in front of you — never the client — for the final call.
            </p>

            <div className="mb-10 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={onNavigateToRegister}
                className="rounded-[3px] bg-maroon px-6.5 py-3.5 text-[15px] font-semibold text-parchment transition-colors hover:bg-maroon-bright cursor-pointer"
              >
                Get started free
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("how")}
                className="rounded-[3px] border border-line bg-transparent px-6.5 py-3.5 text-[15px] font-semibold text-ink transition-colors hover:border-ink cursor-pointer"
              >
                See how review works →
              </button>
            </div>

            <div className="flex flex-wrap gap-7 border-t border-line pt-5.5 text-[13px] text-ink-soft">
              <span className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-gold shrink-0">
                  <path d="M12 2L4 6V12C4 17 7.5 21 12 22C16.5 21 20 17 20 12V6L12 2Z" stroke="currentColor" strokeWidth="1.8" />
                </svg>
                RA 10173-aligned handling
              </span>
              <span className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-gold shrink-0">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Attorney sign-off required
              </span>
            </div>
          </div>

          {/* SIGNATURE ELEMENT: Annotated Clause Card */}
          <div className="relative">
            <div className="relative rotate-[0.6deg] rounded-[6px] border border-line bg-white p-7 sm:p-8 shadow-2xl">
              {/* Wax-seal stamp */}
              <svg className="absolute -right-5 -top-5 h-20 w-20 drop-shadow-[0_6px_10px_rgba(176,141,79,0.35)]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke="#B08D4F" strokeWidth="1.5" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#B08D4F" strokeWidth="1" />
                <path id="sealCircle" d="M 50,12 A 38,38 0 1,1 49.9,12" fill="none" />
                <text font-family="IBM Plex Mono" font-size="6.3" letter-spacing="2.5" fill="#B08D4F">
                  <textPath href="#sealCircle" startOffset="2">ATTORNEY REVIEWED • APPROVED •</textPath>
                </text>
                <path d="M38 50L46 58L63 40" stroke="#B08D4F" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

              <div className="mb-4.5 flex items-baseline justify-between border-b border-line pb-3.5">
                <span className="font-mono text-xs tracking-[0.02em] text-ink-soft">
                  CLAUSE 8.2 — TERMINATION
                </span>
                <span className="rounded-full bg-maroon/10 px-2.5 py-0.5 font-mono text-[10.5px] font-medium tracking-[0.06em] text-maroon uppercase">
                  Flagged
                </span>
              </div>

              <div className="mb-3.5 font-serif text-[17px] font-medium text-navy-deep">
                Employment Contract, Sec. 8
              </div>

              <div className="text-[14.5px] leading-[1.75] text-[#3a352d]">
                "The Employer may terminate this Agreement{" "}
                <span className="border-b-2 border-maroon bg-maroon/[0.09] px-0.5 font-medium">
                  without cause
                </span>{" "}
                upon fifteen (15) days' written notice to the Employee, without further obligation..."
              </div>

              {/* Margin Note */}
              <div className="mt-4 flex gap-2.5 rounded-r-[4px] border-l-[2.5px] border-maroon bg-parchment p-3">
                <svg viewBox="0 0 24 24" fill="none" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-maroon">
                  <path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18A2 2 0 003.54 21H20.46A2 2 0 0022.18 18L13.71 3.86A2 2 0 0010.29 3.86Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="text-[12.5px] leading-[1.55] text-ink-soft">
                  <b className="font-semibold text-ink">Possible just-cause conflict.</b> Notice period alone may not satisfy dismissal requirements.
                  <span className="mt-1 block font-mono text-[11px] text-maroon">
                    Cf. Labor Code, Art. 297–298
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-dashed border-line pt-4">
                <div className="flex items-center gap-2 text-[12.5px] text-ink-soft">
                  <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-navy text-[9.5px] font-bold text-white">
                    MD
                  </div>
                  Reviewed by Atty. M. dela Cruz
                </div>
                <span className="font-mono text-[11px] text-ink-soft">14:02</span>
              </div>
            </div>

            {/* Floating Tag */}
            <div className="absolute -bottom-4.5 -left-4 flex -rotate-2 items-center gap-2 rounded-[5px] bg-navy-deep px-3.5 py-2 font-mono text-[11px] text-parchment shadow-xl">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7CC28C]" />
              Client notified on release
            </div>
          </div>
        </section>

        {/* ===== CHAIN OF CUSTODY ===== */}
        <section id="how" className="mx-auto max-w-[1360px] px-6 py-20 md:px-14 md:py-24 border-t border-line">
          <div className="mb-16 max-w-[620px]">
            <div className="mb-3 flex items-center gap-2 font-mono text-xs font-medium tracking-[0.08em] text-maroon uppercase">
              Chain of custody
            </div>
            <h2 className="font-serif text-[36px] font-medium leading-[1.15] tracking-[-0.01em] text-navy-deep">
              A contract's path from upload to release
            </h2>
          </div>

          <div className="relative pl-2">
            <div className="absolute bottom-2 left-[27px] top-2 w-[1px] bg-gradient-to-b from-maroon via-line to-line" />

            {/* Step 1 */}
            <div className="relative flex gap-7 pb-14">
              <div className="relative z-10 flex h-[55px] w-[55px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-maroon bg-maroon font-mono text-sm font-medium text-white">
                01
              </div>
              <div className="pt-1.5">
                <span className="mb-1.5 block font-mono text-[11.5px] tracking-[0.03em] text-ink-soft">
                  STEP 01 — FILED
                </span>
                <h3 className="mb-2 font-serif text-[21px] font-medium text-navy-deep">
                  Client uploads the contract
                </h3>
                <p className="max-w-[480px] text-[14.5px] leading-[1.65] text-ink-soft">
                  PDF or scanned image, OCR'd automatically. Nothing is shown to the client beyond confirmation of receipt.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex gap-7 pb-14">
              <div className="relative z-10 flex h-[55px] w-[55px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-navy-deep bg-parchment font-mono text-sm font-medium text-navy-deep">
                02
              </div>
              <div className="pt-1.5">
                <span className="mb-1.5 block font-mono text-[11.5px] tracking-[0.03em] text-ink-soft">
                  STEP 02 — FLAGGED
                </span>
                <h3 className="mb-2 font-serif text-[21px] font-medium text-navy-deep">
                  Clauses are checked against statute
                </h3>
                <p className="max-w-[480px] text-[14.5px] leading-[1.65] text-ink-soft">
                  Each clause is compared to the Labor Code and relevant DOLE issuances. Risk flags are drafted, cited, and queued — visible only to the assigned attorney.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex gap-7">
              <div className="relative z-10 flex h-[55px] w-[55px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-navy-deep bg-parchment font-mono text-sm font-medium text-navy-deep">
                03
              </div>
              <div className="pt-1.5">
                <span className="mb-1.5 block font-mono text-[11.5px] tracking-[0.03em] text-ink-soft">
                  STEP 03 — RELEASED
                </span>
                <h3 className="mb-2 font-serif text-[21px] font-medium text-navy-deep">
                  Attorney confirms, edits, or overrides
                </h3>
                <p className="max-w-[480px] text-[14.5px] leading-[1.65] text-ink-soft">
                  You approve the final report clause by clause. Only what you sign off on reaches the client.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FOR ATTORNEYS BENTO ===== */}
        <section id="attorneys" className="mx-auto max-w-[1360px] px-6 py-20 md:px-14 md:py-24 border-t border-line">
          <div className="mb-16 max-w-[620px]">
            <div className="mb-3 flex items-center gap-2 font-mono text-xs font-medium tracking-[0.08em] text-maroon uppercase">
              For attorneys
            </div>
            <h2 className="font-serif text-[36px] font-medium leading-[1.15] tracking-[-0.01em] text-navy-deep">
              Built for the realities of solo and freelance practice
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-[1.4fr_1fr]">
            {/* Main Anchor Card */}
            <div className="flex flex-col justify-between rounded-[8px] border border-line bg-navy-deep p-8 text-parchment">
              <div>
                <span className="mb-4 block font-mono text-[11px] tracking-[0.06em] text-gold uppercase">
                  Your queue
                </span>
                <h3 className="mb-3.5 max-w-[340px] font-serif text-[27px] font-medium leading-[1.2] text-parchment">
                  One dashboard for every contract awaiting your judgment.
                </h3>
                <p className="max-w-[360px] text-[14.5px] leading-[1.65] text-parchment/70">
                  Sorted by urgency, not upload time — so the client waiting three days always surfaces before the one waiting three hours.
                </p>
              </div>

              {/* Mini Dashboard */}
              <div className="mt-8 rounded-[6px] border border-parchment/15 bg-parchment/[0.05] p-4">
                <div className="flex items-center justify-between border-b border-parchment/10 py-2.5 text-[12.5px]">
                  <span className="font-mono text-parchment">acme_vendor_agreement.pdf</span>
                  <span className="rounded-full bg-maroon/30 px-2.5 py-0.5 font-mono text-[10px] text-[#E39AA8]">
                    2 flags
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-parchment/10 py-2.5 text-[12.5px]">
                  <span className="font-mono text-parchment">delacruz_employment.pdf</span>
                  <span className="rounded-full bg-gold/20 px-2.5 py-0.5 font-mono text-[10px] text-gold">
                    In review
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5 text-[12.5px]">
                  <span className="font-mono text-parchment">santos_nda_v2.pdf</span>
                  <span className="rounded-full bg-[#7CC28C]/20 px-2.5 py-0.5 font-mono text-[10px] text-[#8FD49E]">
                    Approved
                  </span>
                </div>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="flex flex-col gap-5">
              <div className="rounded-[8px] border border-line bg-white p-8">
                <div className="mb-2.5 font-serif text-[44px] font-medium leading-none text-navy-deep">
                  15hrs
                </div>
                <div className="text-[13.5px] leading-[1.5] text-ink-soft">
                  Average time saved per contract, versus a manual first pass.
                </div>
              </div>

              <div className="rounded-[8px] border border-line bg-white p-8">
                <div className="mb-2.5 font-serif text-[44px] font-medium leading-none text-navy-deep">
                  100%
                </div>
                <div className="text-[13.5px] leading-[1.5] text-ink-soft">
                  Of reports require your explicit approval before a client sees them. No auto-release, ever.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECURITY & COMPLIANCE BAND ===== */}
        <div id="security" className="bg-navy-deep">
          <div className="mx-auto grid max-w-[1360px] grid-cols-1 items-center gap-14 px-6 py-24 md:grid-cols-[0.9fr_1.1fr] md:px-14">
            <div>
              <div className="mb-3 flex items-center gap-2 font-mono text-xs font-medium tracking-[0.08em] text-gold uppercase">
                <span className="h-[1px] w-[22px] bg-gold" />
                Security & compliance
              </div>
              <h2 className="font-serif text-[36px] font-medium leading-[1.15] tracking-[-0.01em] text-parchment">
                Client trust is the whole practice
              </h2>
              <p className="mt-4.5 max-w-[440px] text-[15.5px] leading-[1.7] text-parchment/65">
                Every upload, flag, and override is logged. Nothing leaves the platform without your name on it.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1px] overflow-hidden rounded-[8px] bg-parchment/12">
              <div className="bg-navy-deep p-6">
                <svg viewBox="0 0 24 24" fill="none" className="mb-3.5 h-5 w-5 text-gold">
                  <rect x="4" y="10" width="16" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M8 10V7A4 4 0 0116 7V10" stroke="currentColor" strokeWidth="1.6" />
                </svg>
                <h4 className="mb-2 font-serif text-[15.5px] font-medium text-parchment">
                  Encrypted at rest
                </h4>
                <p className="text-[12.5px] leading-[1.6] text-parchment/55">
                  Contracts and reports are encrypted in storage and in transit, end to end.
                </p>
              </div>

              <div className="bg-navy-deep p-6">
                <svg viewBox="0 0 24 24" fill="none" className="mb-3.5 h-5 w-5 text-gold">
                  <path d="M12 2L4 6V12C4 17 7.5 21 12 22C16.5 21 20 17 20 12V6L12 2Z" stroke="currentColor" strokeWidth="1.6" />
                </svg>
                <h4 className="mb-2 font-serif text-[15.5px] font-medium text-parchment">
                  RA 10173-aligned
                </h4>
                <p className="text-[12.5px] leading-[1.6] text-parchment/55">
                  Data handling follows the Data Privacy Act, with audit logs on every access.
                </p>
              </div>

              <div className="bg-navy-deep p-6">
                <svg viewBox="0 0 24 24" fill="none" className="mb-3.5 h-5 w-5 text-gold">
                  <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M5 21C5 16.5 8 14 12 14C16 14 19 16.5 19 21" stroke="currentColor" strokeWidth="1.6" />
                </svg>
                <h4 className="mb-2 font-serif text-[15.5px] font-medium text-parchment">
                  Client-blind AI
                </h4>
                <p className="text-[12.5px] leading-[1.6] text-parchment/55">
                  Clients never see raw AI output — only the report their attorney has approved.
                </p>
              </div>

              <div className="bg-navy-deep p-6">
                <svg viewBox="0 0 24 24" fill="none" className="mb-3.5 h-5 w-5 text-gold">
                  <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
                </svg>
                <h4 className="mb-2 font-serif text-[15.5px] font-medium text-parchment">
                  Full audit trail
                </h4>
                <p className="text-[12.5px] leading-[1.6] text-parchment/55">
                  Every override and approval is timestamped and attributed to the reviewing attorney.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ===== CTA BAND ===== */}
        <section className="mx-auto max-w-[760px] px-6 py-24 text-center">
          <h2 className="mb-4.5 font-serif text-[38px] font-medium leading-[1.2] text-navy-deep">
            Attorney accounts are set up by our team.
          </h2>
          <p className="mb-8.5 text-base text-ink-soft">
            If you're a licensed attorney interested in using Lingkod Batas, reach out and we'll set up your account — self-registration is reserved for clients.
          </p>
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="rounded-[3px] bg-maroon px-6.5 py-3.5 text-[15px] font-semibold text-parchment transition-colors hover:bg-maroon-bright cursor-pointer"
          >
            Request an attorney account
          </button>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

export default LandingPage;
