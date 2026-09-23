import { useEffect, useRef } from "react";

interface PrivacyPolicyModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Privacy Policy modal for Lingkod Batas, fully aligned with
 * Republic Act No. 10173 (Philippine Data Privacy Act of 2012).
 */
function PrivacyPolicyModal({ open, onClose }: PrivacyPolicyModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    dialogRef.current?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/60 px-4 py-8 backdrop-blur-xs animate-fade-in-up"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-modal-title"
        tabIndex={-1}
        className="flex max-h-[85vh] w-full max-w-[640px] flex-col overflow-hidden rounded-[10px] border border-line bg-white shadow-2xl outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line bg-navy-deep px-6 py-4.5 text-parchment">
          <div>
            <div className="font-mono text-[10.5px] font-semibold text-gold uppercase tracking-wider">
              Republic Act No. 10173 Compliance
            </div>
            <h2
              id="privacy-modal-title"
              className="font-serif text-[19px] font-medium text-parchment mt-0.5"
            >
              Privacy Policy &amp; Data Protection
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close privacy policy"
            className="flex h-8 w-8 items-center justify-center rounded-full text-parchment/70 hover:bg-parchment/10 hover:text-parchment cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-7 py-6 text-[13.5px] leading-[1.65] text-ink">
          <div className="mb-5 rounded-[6px] border border-green/30 bg-green/[0.06] p-3.5 text-xs text-ink-soft">
            <span className="font-semibold text-green">
              Worker Data Protection:
            </span>{" "}
            Lingkod Batas adheres strictly to the{" "}
            <b>Philippine Data Privacy Act of 2012 (RA 10173)</b>. Your
            submitted contracts and sensitive employment details are encrypted,
            kept strictly confidential, and processed solely for legal
            compliance review.
          </div>

          <p className="mb-5 font-mono text-[10.5px] tracking-[0.05em] text-ink-soft uppercase">
            Effective Date: September 23, 2026
          </p>

          <Section title="1. Information We Collect">
            We collect only the personal information strictly necessary to
            provide contract review services:
            <ul className="mt-2 list-disc pl-5 space-y-1 text-ink-soft">
              <li>
                <b>Account Information:</b> Name, email address, and optional
                contact phone.
              </li>
              <li>
                <b>Contractual Data:</b> Uploaded PDF documents or scanned
                images containing terms of employment, compensation details, job
                titles, and restrictive covenants.
              </li>
              <li>
                <b>Audit Logs:</b> Session metadata, upload timestamps, and
                review verification logs.
              </li>
            </ul>
          </Section>

          <Section title="2. Purpose of Data Processing">
            In accordance with the National Privacy Commission (NPC) principles
            of Transparency, Legitimate Purpose, and Proportionality, data is
            processed exclusively to:
            <ul className="mt-2 list-disc pl-5 space-y-1 text-ink-soft">
              <li>
                Extract clause text via secure optical character recognition
                (OCR).
              </li>
              <li>
                Perform statutory matching against Philippine labor standards
                (Articles 83, 113, 281, 297–298, and DOLE orders).
              </li>
              <li>
                Present the document to <b>Atty. Danielito Jimenez</b> and
                authorized legal counsel for manual verification and advice
                annotation.
              </li>
              <li>Generate the downloadable legal advisory report.</li>
            </ul>
            <p className="mt-2 font-medium text-navy-deep">
              Your employment documents are never sold, rented, or
              commercialized for third-party advertising.
            </p>
          </Section>

          <Section title="3. Confidentiality & Legal Privilege">
            All documents and communications on Lingkod Batas are protected
            under professional attorney-client confidentiality rules. Only you
            and the assigned reviewing counsel have authorized access to your
            unredacted contract analysis.
          </Section>

          <Section title="4. Storage & Information Security">
            Data is protected by industry-standard technical safeguards:
            <ul className="mt-2 list-disc pl-5 space-y-1 text-ink-soft">
              <li>HTTPS / TLS 1.3 encryption for all data in transit.</li>
              <li>
                Encrypted cloud storage buckets with time-limited signed URLs.
              </li>
              <li>
                Salted bcrypt hashing for user authentication credentials.
              </li>
            </ul>
          </Section>

          <Section title="5. Data Retention & Deletion Policy">
            Contracts and generated reports remain in your secure personal
            portal so you can access renegotiation guidance when communicating
            with your employer. You have the statutory right to request complete
            permanent deletion of your uploaded documents and account at any
            time.
          </Section>

          <Section title="6. Your Rights under RA 10173 (Data Subject Rights)">
            As a data subject under Philippine law, you are entitled to:
            <ul className="mt-2 list-disc pl-5 space-y-1 text-ink-soft">
              <li>
                <b>Right to be Informed:</b> Clear disclosure of how your
                contract data is analyzed.
              </li>
              <li>
                <b>Right to Access:</b> Immediate view of all extracted clauses
                and attorney notes.
              </li>
              <li>
                <b>Right to Rectification:</b> The ability to correct personal
                profile inaccuracies.
              </li>
              <li>
                <b>Right to Erasure or Blocking:</b> Permanent removal of your
                contract records from our servers upon request.
              </li>
            </ul>
          </Section>

          <Section title="7. Contacting the Data Protection Officer">
            For privacy inquiries, data subject requests, or questions regarding
            our compliance with the Data Privacy Act of 2012, reach out directly
            to the Lingkod Batas team or Atty. Danielito Jimenez via{" "}
            <b>privacy@lingkodbatas.ph</b>.
          </Section>
        </div>

        {/* Footer */}
        <div className="border-t border-line bg-parchment/30 px-6 py-4 flex items-center justify-between">
          <span className="font-mono text-xs text-ink-soft">
            Lingkod Batas · RA 10173 Aligned
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[5px] bg-maroon px-6 py-2.5 text-[13.5px] font-semibold text-parchment transition-colors hover:bg-maroon-bright cursor-pointer"
          >
            I Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <h3 className="mb-1.5 font-serif text-[15px] font-medium text-navy-deep">
        {title}
      </h3>
      <div className="text-ink-soft leading-relaxed">{children}</div>
    </div>
  );
}

export default PrivacyPolicyModal;
