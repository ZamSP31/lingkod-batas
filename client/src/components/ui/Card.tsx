import type { ReactNode } from "react";

interface CardProps {
  title: string;
  description?: string;
  /** "danger" tints the card for destructive sections, e.g. "Delete account". */
  tone?: "default" | "danger";
  children: ReactNode;
}

/** A titled white card used to group related fields/actions, e.g. on the Account page. */
function Card({ title, description, tone = "default", children }: CardProps) {
  const isDanger = tone === "danger";

  return (
    <section
      className={`rounded-xl border p-6 ${
        isDanger
          ? "border-maroon-200 bg-maroon-600/[0.02]"
          : "border-hairline bg-white"
      }`}
    >
      <h2
        className={`text-base font-semibold ${isDanger ? "text-maroon-700" : "text-ink-900"}`}
      >
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-sm text-ink-600">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default Card;
