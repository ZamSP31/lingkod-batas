import { useState } from "react";
import LandingHeader from "../components/landing/LandingHeader.js";
import LandingFooter from "../components/landing/LandingFooter.js";
import StepItem from "../components/landing/StepItem.js";
import FeatureCard from "../components/landing/FeatureCard.js";
import type { LandingTab } from "../components/landing/LandingHeader.js";
import {
  LockIcon,
  UserCheckIcon,
  BadgeCheckIcon,
  LinkIcon,
  ClockIcon,
  GavelIcon,
  TrendingUpIcon,
} from "../components/landing/icons.js";

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}

const STEPS = [
  {
    title: "Upload the contract",
    description:
      "Scanned or digital PDFs are read through OCR, and unreadable files are flagged rather than passed through silently.",
  },
  {
    title: "Clauses are segmented and classified",
    description:
      "The system identifies indemnification, renewal, IP assignment, liability, and confidentiality clauses. You can re-tag anything it gets wrong.",
  },
  {
    title: "Each clause is flagged and cited",
    description:
      "Risk levels are grounded in retrieved statutory passages. No high-risk flag appears without a citable legal basis.",
  },
  {
    title: "You review, approve, and export",
    description:
      "Nothing reaches a client until you've approved it. Export a plain-English summary, or answer follow-up questions grounded in the same sources.",
  },
];

// Card 2's copy ("Only the attorney who uploaded a document can view it")
// didn't match Chapter 3's actual access model — Clients upload contracts,
// Attorneys are assigned to review them, and Chapter 3's Security Measures
// section specifies role-based visibility "so that only the assigned
// attorney—not other clients—can view a contract's analysis." Corrected
// below to reflect that.
const SECURITY_FEATURES = [
  {
    icon: <LockIcon />,
    title: "Encrypted in transit and at rest",
    description:
      "Every uploaded contract is encrypted the moment it reaches the system.",
  },
  {
    icon: <UserCheckIcon />,
    title: "Restricted access per case",
    description:
      "Only the submitting client and their assigned attorney can view a contract's analysis — no other client or attorney has access.",
  },
  {
    icon: <BadgeCheckIcon />,
    title: "Human approval required",
    description: "No AI output reaches a client without your sign-off first.",
  },
  {
    icon: <LinkIcon />,
    title: "Every flag is traceable",
    description:
      "Each risk flag links back to the exact clause and statutory citation behind it.",
  },
];

const ATTORNEY_FEATURES = [
  {
    icon: <ClockIcon />,
    title: "Available outside office hours",
    description:
      "Review contracts whenever your schedule allows, without waiting on a firm's infrastructure.",
  },
  {
    icon: <GavelIcon />,
    title: "Your judgment stays final",
    description:
      "The system flags and cites; you approve, edit, or override every recommendation.",
  },
  {
    icon: <TrendingUpIcon />,
    title: "Scales with your caseload",
    description:
      "Handle more contracts per month without a proportional increase in review time.",
  },
];

function LandingPage({
  onNavigateToLogin,
  onNavigateToRegister,
}: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<LandingTab>("how-it-works");

  return (
    <div className="flex min-h-screen flex-col bg-parchment-100">
      <LandingHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNavigateToLogin={onNavigateToLogin}
        onNavigateToRegister={onNavigateToRegister}
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-14">
        {activeTab === "how-it-works" && (
          <section>
            <p className="text-center text-sm font-medium text-maroon-600">
              How it works
            </p>
            <h1 className="mt-2 text-center font-display text-3xl font-semibold text-navy-950">
              From upload to client-ready summary
            </h1>
            <div className="mx-auto mt-10 flex max-w-xl flex-col gap-8">
              {STEPS.map((step, i) => (
                <StepItem
                  key={step.title}
                  index={i + 1}
                  title={step.title}
                  description={step.description}
                />
              ))}
            </div>
          </section>
        )}

        {activeTab === "security" && (
          <section>
            <p className="text-center text-sm font-medium text-maroon-600">
              Security
            </p>
            <h1 className="mt-2 text-center font-display text-3xl font-semibold text-navy-950">
              Built around client confidentiality
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-center text-sm text-ink-600">
              Contract review touches privileged client data. Every part of the
              system is built with that in mind, from upload to export.
            </p>
            <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
              {SECURITY_FEATURES.map((feature) => (
                <FeatureCard key={feature.title} {...feature} />
              ))}
            </div>
          </section>
        )}

        {activeTab === "for-attorneys" && (
          <section>
            <p className="text-center text-sm font-medium text-maroon-600">
              For attorneys
            </p>
            <h1 className="mt-2 text-center font-display text-3xl font-semibold text-navy-950">
              Made for the realities of solo and freelance practice
            </h1>
            <div className="mx-auto mt-10 flex max-w-xl flex-col gap-4">
              {ATTORNEY_FEATURES.map((feature) => (
                <FeatureCard key={feature.title} {...feature} />
              ))}
            </div>

            {/* Gap-fill: per Chapter 3, Attorney accounts are
                admin-provisioned and never self-registered, so the header's
                "Sign up" button doesn't apply to this audience. This note
                avoids sending attorneys into the Client registration flow. */}
            <p className="mx-auto mt-8 max-w-xl text-center text-sm text-ink-600">
              Attorney accounts are created by our team, not through
              self-registration. If you&rsquo;re a licensed attorney interested
              in using Lingkod Batas, reach out and we&rsquo;ll set up your
              account.
            </p>
          </section>
        )}
      </main>

      <LandingFooter />
    </div>
  );
}

export default LandingPage;
