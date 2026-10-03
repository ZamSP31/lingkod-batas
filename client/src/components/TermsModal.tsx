import { useEffect, useRef } from "react";

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Terms and Conditions modal for Lingkod Batas, tailored to the
 * Pinoy Street Lawyer advocacy led by Atty. Danielito Jimenez.
 */
function TermsModal({ open, onClose }: TermsModalProps) {
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
        aria-labelledby="terms-modal-title"
        tabIndex={-1}
        className="flex max-h-[85vh] w-full max-w-[640px] flex-col overflow-hidden rounded-[10px] border border-line bg-white shadow-2xl outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line bg-navy-deep px-6 py-4.5 text-parchment">
          <div>
            <div className="font-mono text-[10.5px] font-semibold text-gold uppercase tracking-wider">
              Legal Terms &amp; Conditions
            </div>
            <h2
              id="terms-modal-title"
              className="font-serif text-[19px] font-medium text-parchment mt-0.5"
            >
              Terms of Service &amp; Advocacy Agreement
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close terms and conditions"
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
          <div className="mb-5 rounded-[6px] border border-gold/30 bg-parchment/60 p-3.5 text-xs text-ink-soft">
            <span className="font-semibold text-navy-deep">
              Advocacy Mission:
            </span>{" "}
            Lingkod Batas operates in partnership with the{" "}
            <b>Pinoy Street Lawyer</b> advocacy led by{" "}
            <b>Atty. Danielito Jimenez (IBP Roll No. 67890)</b> to provide
            accessible, AI-assisted, and attorney-verified employment contract
            reviews for everyday Filipino workers.
          </div>

          <p className="mb-5 font-mono text-[10.5px] tracking-[0.05em] text-ink-soft uppercase">
            Effective Date: September 23, 2026
          </p>

          <Section title="1. Acceptance of Terms">
            By creating an account, accessing the platform, or uploading any
            employment contract to Lingkod Batas, you agree to be bound by these
            Terms of Service. If you do not agree with any part of these terms,
            please refrain from using the platform.
          </Section>

          <Section title="2. Description of Service & Advocacy Model">
            Lingkod Batas provides a hybrid, human-in-the-loop legal review
            technology. The platform employs optical character recognition (OCR)
            and retrieval-augmented generation (RAG) against the Philippine
            Labor Code, DOLE Department Orders, and Supreme Court doctrines to
            highlight clauses requiring scrutiny. All findings are queued for
            verification by licensed counsel before release to the client.
          </Section>

          <Section title="3. Nature of Attorney-Client Engagement">
            Submitting a contract for review constitutes a request for
            preliminary legal compliance assessment. An advisory attorney-client
            relationship for the limited scope of the contract review is
            established only when <b>Atty. Danielito Jimenez</b> (or his
            designated associate counsel) validates, annotates, and officially
            releases the final advisory report. Use of this platform does not
            constitute formal court representation or obligate counsel to enter
            litigation on your behalf.
          </Section>

          <Section title="4. Human-in-the-Loop & AI Limitations">
            True to the Pinoy Street Lawyer ethos, AI technology acts purely as
            an assistive extraction and statutory retrieval tool. AI-generated
            flags do not constitute standalone legal advice and are never
            delivered to the client without attorney verification. The final
            certified report reflects the independent professional judgment and
            notes of the reviewing attorney.
          </Section>

          <Section title="5. User Representations, Age of Majority & Permitted Use">
            You represent and warrant that you are <b>at least 18 years of age</b> and possess the full legal capacity to enter into binding agreements under Philippine law (Republic Act No. 6809 and Civil Code Art. 1327). If you are submitting an employment contract on behalf of a working minor (aged 15 to 17 under Republic Act No. 9231), you represent that you are the minor's parent or legal guardian with lawful authority to grant consent. You further represent that you have the lawful right to submit the document and agree not to upload fraudulent, defamatory, or unlawful materials.
          </Section>

          <Section title="6. Confidentiality & Legal Privilege">
            All submitted draft contracts, salary details, and personal
            communications are treated with strict confidentiality in accordance
            with the Code of Professional Responsibility and Accountability
            (CPRA) and Philippine legal privilege standards.
          </Section>

          <Section title="7. Data Privacy, Third-Party Processors & Cross-Border Processing (RA 10173)">
            In compliance with the Philippine Data Privacy Act of 2012 (RA 10173),
            Lingkod Batas acts as the Personal Information Controller (PIC). By using
            the service, you acknowledge that contract analysis requires specialized
            third-party Personal Information Processors (PIPs) for cloud hosting,
            database storage, optical character recognition, and statutory clause
            evaluation:
            <ul className="mt-2 ml-4 list-disc space-y-1 text-xs text-ink-soft">
              <li>
                <b>Cloud Infrastructure &amp; Storage:</b> Render (application compute),
                MongoDB Atlas (encrypted database storage), Vercel (frontend hosting),
                and Cloudinary (secure encrypted document storage).
              </li>
              <li>
                <b>AI &amp; OCR Assistive Analysis:</b> Specialized AI providers (OpenAI /
                Anthropic) and optical character recognition (Google Cloud Vision).
              </li>
            </ul>
            <p className="mt-2 text-xs text-ink-soft">
              <b>Safeguards in Place:</b> Prior to any external processing, our system
              applies automated Personally Identifiable Information (PII) redaction to
              mask individual names, contact numbers, and identification details. All
              external API providers are governed by commercial Data Processing Addenda
              (DPAs) prohibiting the use of customer contract data for model training.
            </p>
          </Section>

          <Section title="8. Limitation of Liability">
            Advisory reports provide legal evaluations and negotiation action
            plans grounded in Philippine labor standards. While Atty. Jimenez
            exercises diligent professional care, Lingkod Batas and counsel
            cannot guarantee specific employer concessions or hiring outcomes.
          </Section>

          <Section title="9. Governing Law">
            These Terms shall be governed by and construed in accordance with
            the laws of the Republic of the Philippines.
          </Section>
        </div>

        {/* Footer */}
        <div className="border-t border-line bg-parchment/30 px-6 py-4 flex items-center justify-between">
          <span className="font-mono text-xs text-ink-soft">
            Lingkod Batas · Pinoy Street Lawyer
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[5px] bg-maroon px-6 py-2.5 text-[13.5px] font-semibold text-parchment transition-colors hover:bg-maroon-bright cursor-pointer"
          >
            I Understand
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
      <p className="text-ink-soft leading-relaxed">{children}</p>
    </div>
  );
}

export default TermsModal;
