import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  EyeOff,
  Lock,
  Sparkles,
  Scale,
  Info,
  CheckCircle2,
  ChevronRight,
  X,
  ShieldCheck,
  FileText,
} from "lucide-react";
import FileDropzone from "../../components/attorney/FileDropzone.js";
import { useAuth } from "../../context/AuthContext.js";
import { submitContract } from "../../services/contractService.js";

/**
 * Modern Client "Submit contract" page matching Lingkod Batas design standards.
 * Features plain-language trust pills, informed consent verification,
 * a real-time visual progress stepper during submission, and an interactive data notice modal.
 */
function SubmitContractPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [contractType, setContractType] = useState<string>("regular");
  const [consentGiven, setConsentGiven] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState<number>(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const canSubmit = file !== null && contractType !== "" && consentGiven && !isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || !file) {
      if (!consentGiven) {
        setSubmitError("Please confirm your informed consent by checking the privacy agreement box.");
      } else {
        setSubmitError("Please select a valid contract file and specify the contract type.");
      }
      return;
    }

    if (!token) {
      setSubmitError("You must be logged in to submit a contract.");
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    setSubmitStep(1);

    // Timed visual progression so client sees each security phase
    const t1 = setTimeout(() => setSubmitStep(2), 700);
    const t2 = setTimeout(() => setSubmitStep(3), 1600);
    const t3 = setTimeout(() => setSubmitStep(4), 2600);

    try {
      const formData = new FormData();
      formData.append("contractFile", file);
      const derivedTitle = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[_-]/g, " ");
      formData.append("title", derivedTitle || "Employment Agreement");
      formData.append("contractType", contractType || "regular");

      await submitContract(formData, token);

      setSubmitStep(5); // All complete
      await new Promise((resolve) => setTimeout(resolve, 600));
      navigate("/client");
    } catch (err: unknown) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setSubmitStep(0);
      const message =
        err instanceof Error ? err.message : "Failed to upload contract.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-[760px] pb-16 animate-fade-in-up">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif text-[28px] font-medium tracking-tight text-navy-deep mb-2">
          Submit contract for review
        </h1>
        <p className="text-xs text-ink-soft leading-relaxed max-w-[620px]">
          Upload your employment contract for preliminary Labor Code screening. We safeguard your identity, remove personal information before analysis, and connect you directly with licensed legal counsel.
        </p>
      </div>

      {/* Visual Trust Pills (Plain-language & modern Lucide standard icons) */}
      <div className="mb-6 rounded-2xl border border-line bg-parchment/30 p-4 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-soft/70 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Your Document &amp; Privacy Protections
          </span>
          <button
            type="button"
            onClick={() => setShowPrivacyModal(true)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-maroon hover:underline cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
            Where does your contract go?
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Pill 1 */}
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-white px-3 py-2 text-xs font-medium text-emerald-950 shadow-2xs">
            <EyeOff className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="leading-tight">Personal Details Removed</span>
          </div>

          {/* Pill 2 */}
          <div className="flex items-center gap-2 rounded-xl border border-navy-deep/15 bg-white px-3 py-2 text-xs font-medium text-navy-deep shadow-2xs">
            <Lock className="w-4 h-4 text-navy-deep shrink-0" />
            <span className="leading-tight">Encrypted &amp; 100% Private</span>
          </div>

          {/* Pill 3 */}
          <div className="flex items-center gap-2 rounded-xl border border-maroon/20 bg-white px-3 py-2 text-xs font-medium text-maroon shadow-2xs">
            <Sparkles className="w-4 h-4 text-maroon shrink-0" />
            <span className="leading-tight">Never Used to Train AI</span>
          </div>

          {/* Pill 4 */}
          <div className="flex items-center gap-2 rounded-xl border border-amber-300/80 bg-white px-3 py-2 text-xs font-medium text-amber-950 shadow-2xs">
            <Scale className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="leading-tight">Verified by a Real Lawyer</span>
          </div>
        </div>
      </div>

      {/* Main Submission Card */}
      <div className="rounded-2xl border border-line bg-white p-6 sm:p-8 shadow-xs">
        {/* Real-Time Stepper View during Active Submission */}
        {isSubmitting ? (
          <div className="py-6 animate-fade-in">
            <div className="text-center mb-8">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-navy-deep/5 text-navy-deep ring-8 ring-navy-deep/5">
                <FileText className="h-6 w-6 animate-pulse text-navy-deep" />
              </div>
              <h2 className="font-serif text-xl font-medium text-navy-deep">
                Safeguarding &amp; Analyzing Contract
              </h2>
              <p className="text-xs text-ink-soft mt-1">
                Please keep this page open while we secure and screen your document.
              </p>
            </div>

            {/* Stepper Steps */}
            <div className="space-y-4 max-w-[460px] mx-auto">
              {/* Step 1 */}
              <div className={`flex items-start gap-3.5 rounded-xl border p-3.5 transition-all ${
                submitStep > 1
                  ? "border-emerald-200 bg-emerald-50/60 text-emerald-950"
                  : submitStep === 1
                  ? "border-navy-deep/30 bg-navy-deep/5 text-navy-deep ring-2 ring-navy-deep/10"
                  : "border-line bg-white text-ink-soft opacity-50"
              }`}>
                {submitStep > 1 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : submitStep === 1 ? (
                  <div className="h-5 w-5 rounded-full border-2 border-navy-deep border-t-transparent animate-spin shrink-0 mt-0.5" />
                ) : (
                  <div className="h-5 w-5 rounded-full border border-line text-[11px] font-mono flex items-center justify-center shrink-0 mt-0.5">1</div>
                )}
                <div>
                  <p className="text-xs font-semibold">1. Securing &amp; Encrypting Document</p>
                  <p className="text-[11px] text-ink-soft mt-0.5">Uploading your document into a private, encrypted storage vault.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className={`flex items-start gap-3.5 rounded-xl border p-3.5 transition-all ${
                submitStep > 2
                  ? "border-emerald-200 bg-emerald-50/60 text-emerald-950"
                  : submitStep === 2
                  ? "border-navy-deep/30 bg-navy-deep/5 text-navy-deep ring-2 ring-navy-deep/10"
                  : "border-line bg-white text-ink-soft opacity-50"
              }`}>
                {submitStep > 2 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : submitStep === 2 ? (
                  <div className="h-5 w-5 rounded-full border-2 border-navy-deep border-t-transparent animate-spin shrink-0 mt-0.5" />
                ) : (
                  <div className="h-5 w-5 rounded-full border border-line text-[11px] font-mono flex items-center justify-center shrink-0 mt-0.5">2</div>
                )}
                <div>
                  <p className="text-xs font-semibold">2. Reading Text &amp; Removing Personal Details</p>
                  <p className="text-[11px] text-ink-soft mt-0.5">Masking personal names, addresses, and salaries before automated review.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className={`flex items-start gap-3.5 rounded-xl border p-3.5 transition-all ${
                submitStep > 3
                  ? "border-emerald-200 bg-emerald-50/60 text-emerald-950"
                  : submitStep === 3
                  ? "border-navy-deep/30 bg-navy-deep/5 text-navy-deep ring-2 ring-navy-deep/10"
                  : "border-line bg-white text-ink-soft opacity-50"
              }`}>
                {submitStep > 3 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : submitStep === 3 ? (
                  <div className="h-5 w-5 rounded-full border-2 border-navy-deep border-t-transparent animate-spin shrink-0 mt-0.5" />
                ) : (
                  <div className="h-5 w-5 rounded-full border border-line text-[11px] font-mono flex items-center justify-center shrink-0 mt-0.5">3</div>
                )}
                <div>
                  <p className="text-xs font-semibold">3. Screening Against Philippine Labor Laws</p>
                  <p className="text-[11px] text-ink-soft mt-0.5">Comparing contract clauses against DOLE statutory compliance rules.</p>
                </div>
              </div>

              {/* Step 4 */}
              <div className={`flex items-start gap-3.5 rounded-xl border p-3.5 transition-all ${
                submitStep >= 5
                  ? "border-emerald-200 bg-emerald-50/60 text-emerald-950"
                  : submitStep === 4
                  ? "border-navy-deep/30 bg-navy-deep/5 text-navy-deep ring-2 ring-navy-deep/10"
                  : "border-line bg-white text-ink-soft opacity-50"
              }`}>
                {submitStep >= 5 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : submitStep === 4 ? (
                  <div className="h-5 w-5 rounded-full border-2 border-navy-deep border-t-transparent animate-spin shrink-0 mt-0.5" />
                ) : (
                  <div className="h-5 w-5 rounded-full border border-line text-[11px] font-mono flex items-center justify-center shrink-0 mt-0.5">4</div>
                )}
                <div>
                  <p className="text-xs font-semibold">4. Preparing File for Attorney Review</p>
                  <p className="text-[11px] text-ink-soft mt-0.5">Placing preliminary findings into Atty. Jimenez's secure queue.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* File Upload Zone */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-ink-soft">
                Contract document
              </label>
              <FileDropzone
                file={file}
                onFileChange={setFile}
                supportsText="SUPPORTS PDF, PNG, JPEG · SCANNED OR DIGITAL · MAX 20MB"
              />
            </div>

            {/* Contract Classification Field */}
            <div>
              <label
                htmlFor="contractType"
                className="mb-2 block text-xs font-semibold text-ink-soft"
              >
                Contract classification
              </label>
              <div className="relative">
                <select
                  id="contractType"
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink focus:border-navy-deep focus:outline-none focus:ring-2 focus:ring-navy-deep/10 transition-all shadow-2xs cursor-pointer"
                >
                  <option value="regular">Regular Employment Contract</option>
                  <option value="probationary">Probationary Employment Contract</option>
                  <option value="project_based">Project-Based Employment Contract</option>
                  <option value="fixed_term">Fixed-Term Employment Contract</option>
                </select>
                <svg
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft/60"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <p className="mt-1.5 text-[11.5px] text-ink-soft/70">
                Helps the system match clauses with the correct statutory rules (such as Art. 296 for probationary limits).
              </p>
            </div>

            {/* Assigned Reviewing Counsel */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-ink-soft">
                Supervising legal counsel
              </label>
              <div className="flex items-center justify-between rounded-xl border border-line bg-parchment/30 p-4 shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-navy-deep font-bold text-xs shadow-xs ring-2 ring-white">
                    DJ
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-navy-deep flex items-center gap-1.5">
                      Atty. Danielito Jimenez
                      <span className="rounded-full bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 text-[10px] ring-1 ring-emerald-600/15">
                        Verified
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-ink-soft mt-0.5">
                      "Pinoy Street Lawyer" · IBP Roll No. 67890
                    </div>
                  </div>
                </div>
                <span className="hidden sm:inline-flex rounded-full bg-navy/10 px-2.5 py-1 text-[11px] font-semibold text-navy-deep">
                  Direct Gatekeeper
                </span>
              </div>
            </div>

            {/* Informed Consent Step (Mandatory before submission) */}
            <div className="rounded-xl border border-line bg-parchment/40 p-4 transition-all hover:bg-parchment/60">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="contractConsent"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-line text-maroon focus:ring-maroon cursor-pointer accent-maroon"
                />
                <div className="text-xs text-ink leading-relaxed">
                  <span className="font-semibold text-navy-deep">
                    I agree to have my contract reviewed for Philippine Labor Code compliance.
                  </span>{" "}
                  <span className="text-ink-soft">
                    I understand that personal identifying details (such as my name, salary, and contact numbers) will be removed before automated legal screening, and that the final review will be completed by an accredited attorney.
                  </span>{" "}
                  <button
                    type="button"
                    onClick={() => setShowPrivacyModal(true)}
                    className="inline-flex items-center gap-0.5 text-maroon hover:underline font-medium cursor-pointer ml-1"
                  >
                    View Data Notice
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </label>
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="rounded-xl border border-maroon/20 bg-maroon/5 p-3.5 text-xs text-maroon font-medium">
                {submitError}
              </div>
            )}

            {/* Submit Action */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-xl bg-maroon py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-parchment shadow-xs hover:bg-maroon-bright active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              Submit contract for review
            </button>
          </form>
        )}

        {/* Pipeline Process Steps Footer */}
        {!isSubmitting && (
          <div className="mt-8 border-t border-line pt-6">
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-ink-soft/60 mb-4 text-center">
              Verification Pipeline Sequence
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-line bg-parchment/20 p-3">
                <span className="inline-block font-mono text-xs font-bold text-maroon mb-1">
                  STAGE 01
                </span>
                <p className="text-xs font-semibold text-navy-deep">Text Scan &amp; Privacy Mask</p>
                <p className="text-[11px] text-ink-soft mt-0.5">Personal details masked</p>
              </div>
              <div className="rounded-xl border border-line bg-parchment/20 p-3">
                <span className="inline-block font-mono text-xs font-bold text-maroon mb-1">
                  STAGE 02
                </span>
                <p className="text-xs font-semibold text-navy-deep">Labor Code Screening</p>
                <p className="text-[11px] text-ink-soft mt-0.5">8 risk categories analyzed</p>
              </div>
              <div className="rounded-xl border border-line bg-parchment/20 p-3">
                <span className="inline-block font-mono text-xs font-bold text-maroon mb-1">
                  STAGE 03
                </span>
                <p className="text-xs font-semibold text-navy-deep">Counsel Certification</p>
                <p className="text-[11px] text-ink-soft mt-0.5">Attorney signs off report</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Data Privacy & Lifecycle Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="relative w-full max-w-[620px] rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-line max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowPrivacyModal(false)}
              className="absolute right-5 top-5 p-1 rounded-lg text-ink-soft hover:bg-parchment hover:text-ink cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-medium text-navy-deep">
                  Where Does Your Contract Go?
                </h3>
                <p className="text-xs text-ink-soft">
                  Transparent breakdown of how your document is protected under Philippine law.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-ink leading-relaxed">
              {/* Question 1 */}
              <div className="rounded-xl border border-line bg-parchment/20 p-4">
                <h4 className="font-semibold text-navy-deep flex items-center gap-2 mb-1">
                  <EyeOff className="w-4 h-4 text-emerald-600 shrink-0" />
                  Does anyone see my real name or salary?
                </h4>
                <p className="text-ink-soft">
                  <strong>No.</strong> Before any clause is screened by automated tools, our system replaces names, contact numbers, government IDs (TIN, SSS), and specific compensation figures with placeholder tags like <em>[EMPLOYEE_NAME]</em>.
                </p>
              </div>

              {/* Question 2 */}
              <div className="rounded-xl border border-line bg-parchment/20 p-4">
                <h4 className="font-semibold text-navy-deep flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-maroon shrink-0" />
                  Do outside AI companies keep or learn from my contract?
                </h4>
                <p className="text-ink-soft">
                  <strong>No.</strong> We use enterprise-grade private APIs with a zero-data-retention agreement. Your contract text is never saved to train public AI models, and temporary processing logs are purged automatically.
                </p>
              </div>

              {/* Question 3 */}
              <div className="rounded-xl border border-line bg-parchment/20 p-4">
                <h4 className="font-semibold text-navy-deep flex items-center gap-2 mb-1">
                  <Lock className="w-4 h-4 text-navy-deep shrink-0" />
                  Where is my original file stored?
                </h4>
                <p className="text-ink-soft">
                  Your uploaded file is encrypted in transit and stored in a private cloud repository. Only you and your assigned attorney can view the original file. It is never publicly accessible on the internet.
                </p>
              </div>

              {/* Question 4 */}
              <div className="rounded-xl border border-line bg-parchment/20 p-4">
                <h4 className="font-semibold text-navy-deep flex items-center gap-2 mb-1">
                  <Scale className="w-4 h-4 text-amber-700 shrink-0" />
                  Who gives the final legal approval?
                </h4>
                <p className="text-ink-soft">
                  Automated screening only highlights potentially non-compliant clauses. <strong>Atty. Danielito Jimenez</strong> personally reviews the legal points before issuing the final attorney-certified compliance report.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setConsentGiven(true);
                  setShowPrivacyModal(false);
                }}
                className="rounded-xl bg-navy-deep px-5 py-2.5 text-xs font-semibold text-white hover:bg-navy cursor-pointer transition-all shadow-xs"
              >
                I Understand &amp; Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubmitContractPage;
