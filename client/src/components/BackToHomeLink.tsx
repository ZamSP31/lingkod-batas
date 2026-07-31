interface BackToHomeLinkProps {
  onClick?: (() => void) | undefined;
}

/**
 * Sits above the auth card on Login, Register, and Forgot Password so
 * someone who clicked Log in/Sign up by mistake has an easy way back to
 * the landing page, without needing to use the browser's back button.
 */
function BackToHomeLink({ onClick }: BackToHomeLinkProps) {
  if (!onClick) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-4 flex items-center gap-1.5 text-sm font-medium text-ink-600 transition-colors hover:text-navy-900"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          d="M15 5l-7 7 7 7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Back to home
    </button>
  );
}

export default BackToHomeLink;
