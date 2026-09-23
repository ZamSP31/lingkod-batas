import { useState } from "react";
import TermsModal from "../TermsModal.js";
import PrivacyPolicyModal from "../PrivacyPolicyModal.js";

/**
 * Official landing footer with advocacy copyright and clickable
 * Privacy Policy and Terms of Service legal modals.
 */
function LandingFooter() {
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  return (
    <>
      <footer className="bg-navy-deep px-6 py-10 text-parchment/60 md:px-14 border-t border-parchment/10">
        <div className="mx-auto flex max-w-[1360px] flex-col sm:flex-row items-center justify-between gap-5 text-[13px]">
          {/* Brand & Advocacy Notice */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span className="font-semibold text-parchment text-base tracking-tight">
              Lingkod Batas
            </span>
            <span className="hidden sm:inline text-parchment/30">|</span>
            <span className="text-[12.5px] text-parchment/70">
              © 2026 In partnership with the Pinoy Street Lawyer Advocacy led by
              Atty. Danielito Jimenez.
            </span>
          </div>

          {/* Legal Links */}
          <div className="flex items-center gap-5 text-[12.5px] font-medium text-parchment/80">
            <button
              type="button"
              onClick={() => setIsPrivacyOpen(true)}
              className="transition-colors hover:text-gold hover:underline cursor-pointer"
            >
              Privacy Policy
            </button>
            <span className="text-parchment/30">·</span>
            <button
              type="button"
              onClick={() => setIsTermsOpen(true)}
              className="transition-colors hover:text-gold hover:underline cursor-pointer"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TermsModal open={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <PrivacyPolicyModal
        open={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
    </>
  );
}

export default LandingFooter;
