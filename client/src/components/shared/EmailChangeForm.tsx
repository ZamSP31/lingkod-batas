import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.js";
import { requestEmailChange, confirmEmailChange } from "../../services/authService.js";

function VisibilityIcon({ visible }: { visible: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M2.5 12S5.7 5.5 12 5.5 21.5 12 21.5 12 18.3 18.5 12 18.5 2.5 12 2.5 12z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.5" />
      {!visible && <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />}
    </svg>
  );
}

export default function EmailChangeForm() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || busy) return;
    setBusy(true); setError("");
    try {
      if (sent) {
        const result = await confirmEmailChange(otp, token);
        logout();
        navigate("/login", { replace: true, state: { message: result.message } });
      } else {
        const result = await requestEmailChange(email, password, token);
        setPassword(""); setShowPassword(false); setShowOtp(false); setSent(true); setMessage(result.message);
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Email change failed.");
    } finally { setBusy(false); }
  }

  const inputClass = "w-full rounded border border-line px-3 py-2 mt-1";
  return (
    <section className="mt-6 rounded-xl border border-line bg-white p-6">
      <h2 className="font-semibold">Change email address</h2>
      <p className="text-sm text-ink-soft mt-2">Confirm your current password and verify your new email. All sessions will sign out after the change.</p>
      <form onSubmit={submit} className="mt-4 grid gap-4 max-w-lg">
        <label className="text-sm">New email address
          <input className={inputClass} type="email" autoComplete="email" required maxLength={254}
            value={email} disabled={sent || busy} onChange={(event) => setEmail(event.target.value)} />
        </label>
        {!sent ? <label className="text-sm">Current password
          <div className="relative mt-1">
            <input className="w-full rounded border border-line px-3 py-2 pr-10" type={showPassword ? "text" : "password"} autoComplete="current-password" required maxLength={128}
              value={password} disabled={busy} onChange={(event) => setPassword(event.target.value)} />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide current password" : "Show current password"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-ink-soft hover:text-ink focus-visible:outline-none"
            >
              <VisibilityIcon visible={showPassword} />
            </button>
          </div>
        </label> : <label className="text-sm">Verification code sent to your new email
          <div className="relative mt-1">
            <input className="w-full rounded border border-line px-3 py-2 pr-10" type={showOtp ? "text" : "password"} inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6}" maxLength={6}
              value={otp} disabled={busy} onChange={(event) => setOtp(event.target.value)} />
            <button
              type="button"
              onClick={() => setShowOtp((visible) => !visible)}
              aria-label={showOtp ? "Hide verification code" : "Show verification code"}
              aria-pressed={showOtp}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-ink-soft hover:text-ink focus-visible:outline-none"
            >
              <VisibilityIcon visible={showOtp} />
            </button>
          </div>
        </label>}
        {message && <p role="status" className="text-sm">{message}</p>}
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button className="rounded bg-navy text-white px-4 py-2 disabled:opacity-50" type="submit" disabled={busy}>
          {busy ? "Please wait..." : sent ? "Confirm email change" : "Send verification code"}
        </button>
        {sent && <button type="button" disabled={busy} className="text-sm underline" onClick={() => {
          setSent(false); setOtp(""); setShowOtp(false); setMessage(""); setError("");
        }}>Start again or request a new code</button>}
      </form>
    </section>
  );
}
