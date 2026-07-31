import type { ReactNode } from "react";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-xl border border-hairline bg-white p-5">
      <div className="text-maroon-600">{icon}</div>
      <h3 className="mt-3 text-sm font-semibold text-navy-950">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-ink-600">{description}</p>
    </div>
  );
}

export default FeatureCard;
