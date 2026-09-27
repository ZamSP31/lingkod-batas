import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Toggle from "../../components/ui/Toggle.js";
import { useAuth } from "../../context/AuthContext.js";
import {
  validateEmail,
  validateName,
  validateContactNumber,
  validateLoginPassword,
  validateNewPassword,
  validateConfirmPassword,
  NAME_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  CONTACT_MAX_LENGTH,
} from "../../utils/validation.js";
import { EyeIcon, EyeOffIcon } from "../../components/shared/icons.js";
import ProfileSavedModal from "../../components/shared/ProfileSavedModal.js";

interface FormErrors {
  firstName?: string | undefined;
  lastName?: string | undefined;
  email?: string | undefined;
  contactNumber?: string | undefined;
  currentPassword?: string | undefined;
  newPassword?: string | undefined;
  confirmNewPassword?: string | undefined;
  general?: string | undefined;
}

/**
 * Client Account management screen matching Lingkod Batas design system.
 */
function ClientAccountPage() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();

  const nameParts = (user?.fullName || "").trim().split(/\s+/);
  const initialFirstName = nameParts[0] || "";
  const initialLastName = nameParts.slice(1).join(" ") || "";
  const initialEmail = user?.email || "";
  const initialContact = user?.contactNumber || "";

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [email, setEmail] = useState(initialEmail);
  const [contactNumber, setContactNumber] = useState(initialContact);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [savedDetails, setSavedDetails] = useState({
    fullName: "",
    email: "",
    contactNumber: "",
    passwordChanged: false,
    role: "Client",
  });

  useEffect(() => {
    if (user) {
      const parts = (user.fullName || "").trim().split(/\s+/);
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" ") || "");
      setEmail(user.email || "");
      setContactNumber(user.contactNumber || "");
    }
  }, [user]);

  // Only consider changing password if user explicitly typed a new password
  const isChangingPassword = Boolean(
    newPassword.trim() || confirmNewPassword.trim(),
  );

  function validate(): FormErrors {
    const nextErrors: FormErrors = {
      firstName: validateName(firstName, "First name"),
      lastName: validateName(lastName, "Last name"),
      email: validateEmail(email),
      contactNumber: validateContactNumber(contactNumber, false),
    };

    if (isChangingPassword) {
      nextErrors.currentPassword = validateLoginPassword(currentPassword);
      nextErrors.newPassword = validateNewPassword(newPassword);
      nextErrors.confirmNewPassword = validateConfirmPassword(
        newPassword,
        confirmNewPassword,
      );
    }

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setIsSubmitting(true);
    setSavedSuccess(false);

    try {
      const hadPasswordChange = isChangingPassword;
      await updateProfile({
        firstName,
        lastName,
        email,
        contactNumber,
        currentPassword: hadPasswordChange ? currentPassword : undefined,
        newPassword: hadPasswordChange ? newPassword : undefined,
      });

      setSavedSuccess(true);
      setSavedDetails({
        fullName: `${firstName} ${lastName}`.trim(),
        email: email.trim(),
        contactNumber: contactNumber.trim(),
        passwordChanged: hadPasswordChange,
        role: "Client",
      });
      setShowSavedModal(true);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmNewPassword(false);
      setErrors({});
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to update profile.";
      if (msg.toLowerCase().includes("current password")) {
        setErrors((prev) => ({ ...prev, currentPassword: msg }));
      } else if (msg.toLowerCase().includes("email")) {
        setErrors((prev) => ({ ...prev, email: msg }));
      } else {
        setErrors((prev) => ({ ...prev, general: msg }));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    const parts = (user?.fullName || "").trim().split(/\s+/);
    setFirstName(parts[0] || "");
    setLastName(parts.slice(1).join(" ") || "");
    setEmail(user?.email || "");
    setContactNumber(user?.contactNumber || "");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
    setErrors({});
    setSavedSuccess(false);
  }

  function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Permanently delete your account and all submitted contracts? This cannot be undone.",
    );
    if (!confirmed) return;
    navigate("/");
  }

  const userInitials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "CL";

  return (
    <div className="max-w-[1080px] pb-10">
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-line pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-deep font-serif">
            Account settings
          </h1>
          <p className="text-xs text-ink-soft mt-1">
            Manage your personal profile details, authentication credentials, and notifications.
          </p>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ProfileSavedModal
        open={showSavedModal}
        onClose={() => setShowSavedModal(false)}
        details={savedDetails}
      />

      {/* In-page Success Banner */}
      {savedSuccess && (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-line bg-white p-4 text-xs text-emerald-800 shadow-xs">
          <div className="flex items-center gap-2.5">
            <svg
              className="h-4.5 w-4.5 shrink-0 text-emerald-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">
              Profile details successfully updated and saved in the system.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSavedSuccess(false)}
            className="text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Banner */}
      {errors.general && (
        <div className="mb-5 rounded-xl border border-maroon/20 bg-maroon/5 p-3.5 text-xs text-maroon font-medium shadow-xs">
          {errors.general}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Left column: main form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Profile Card */}
          <div className="rounded-2xl border border-line bg-white p-6 shadow-xs">
            <div className="border-b border-line pb-4 mb-5">
              <h2 className="text-base font-semibold text-navy-deep tracking-tight">
                Profile details
              </h2>
              <p className="text-xs text-ink-soft mt-0.5">
                Update your identity information associated with your client account.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="client-first-name"
                    className="block text-xs font-semibold text-ink-soft mb-1.5"
                  >
                    First name
                  </label>
                  <input
                    id="client-first-name"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    maxLength={NAME_MAX_LENGTH}
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (errors.firstName) {
                        setErrors((prev) => ({
                          ...prev,
                          firstName: validateName(e.target.value, "First name"),
                        }));
                      }
                    }}
                    className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/40 focus:border-navy-deep focus:outline-none focus:ring-2 focus:ring-navy-deep/10 transition-all shadow-2xs"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-maroon font-medium">
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="client-last-name"
                    className="block text-xs font-semibold text-ink-soft mb-1.5"
                  >
                    Last name
                  </label>
                  <input
                    id="client-last-name"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    maxLength={NAME_MAX_LENGTH}
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (errors.lastName) {
                        setErrors((prev) => ({
                          ...prev,
                          lastName: validateName(e.target.value, "Last name"),
                        }));
                      }
                    }}
                    className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/40 focus:border-navy-deep focus:outline-none focus:ring-2 focus:ring-navy-deep/10 transition-all shadow-2xs"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-xs text-maroon font-medium">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="client-email"
                    className="block text-xs font-semibold text-ink-soft mb-1.5"
                  >
                    Email address
                  </label>
                  <input
                    id="client-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    maxLength={EMAIL_MAX_LENGTH}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) {
                        setErrors((prev) => ({
                          ...prev,
                          email: validateEmail(e.target.value),
                        }));
                      }
                    }}
                    className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/40 focus:border-navy-deep focus:outline-none focus:ring-2 focus:ring-navy-deep/10 transition-all shadow-2xs"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-maroon font-medium">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="client-contact"
                    className="block text-xs font-semibold text-ink-soft mb-1.5"
                  >
                    Contact number
                  </label>
                  <input
                    id="client-contact"
                    name="contactNumber"
                    type="tel"
                    autoComplete="tel"
                    maxLength={CONTACT_MAX_LENGTH}
                    value={contactNumber}
                    onChange={(e) => {
                      const sanitized = e.target.value.replace(
                        /[^\d+\s()-]/g,
                        "",
                      );
                      setContactNumber(sanitized);
                      if (errors.contactNumber) {
                        setErrors((prev) => ({
                          ...prev,
                          contactNumber: validateContactNumber(
                            sanitized,
                            false,
                          ),
                        }));
                      }
                    }}
                    placeholder="e.g. 0917 123 4567 or +63 917 123 4567"
                    className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/40 focus:border-navy-deep focus:outline-none focus:ring-2 focus:ring-navy-deep/10 transition-all shadow-2xs"
                  />
                  {errors.contactNumber && (
                    <p className="mt-1 text-xs text-maroon font-medium">
                      {errors.contactNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="rounded-2xl border border-line bg-white p-6 shadow-xs">
            <div className="border-b border-line pb-4 mb-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-navy-deep tracking-tight">
                  Security &amp; Password
                </h2>
                <span className="rounded-md bg-parchment px-2 py-0.5 text-[11px] font-medium text-ink-soft">
                  Optional
                </span>
              </div>
              <p className="text-xs text-ink-soft mt-0.5">
                Leave these fields blank if you do not wish to update your password.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="client-current-password"
                    className="block text-xs font-semibold text-ink-soft mb-1.5"
                  >
                    Current password
                  </label>
                  <div className="relative">
                    <input
                      id="client-current-password"
                      name="prevent_autofill_current_password"
                      type={showCurrentPassword ? "text" : "password"}
                      autoComplete="new-password"
                      data-lpignore="true"
                      maxLength={PASSWORD_MAX_LENGTH}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 pr-10 text-sm text-ink placeholder:text-ink-soft/40 focus:border-navy-deep focus:outline-none focus:ring-2 focus:ring-navy-deep/10 transition-all shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      aria-label={
                        showCurrentPassword
                          ? "Hide current password"
                          : "Show current password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-soft/50 hover:text-ink cursor-pointer focus:outline-none"
                    >
                      {showCurrentPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <p className="mt-1 text-xs text-maroon font-medium">
                      {errors.currentPassword}
                    </p>
                  )}
                </div>
                <div />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="client-new-password"
                    className="block text-xs font-semibold text-ink-soft mb-1.5"
                  >
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="client-new-password"
                      name="account_new_password"
                      type={showNewPassword ? "text" : "password"}
                      autoComplete="new-password"
                      maxLength={PASSWORD_MAX_LENGTH}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 pr-10 text-sm text-ink placeholder:text-ink-soft/40 focus:border-navy-deep focus:outline-none focus:ring-2 focus:ring-navy-deep/10 transition-all shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      aria-label={
                        showNewPassword
                          ? "Hide new password"
                          : "Show new password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-soft/50 hover:text-ink cursor-pointer focus:outline-none"
                    >
                      {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="mt-1 text-xs text-maroon font-medium">
                      {errors.newPassword}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="client-confirm-password"
                    className="block text-xs font-semibold text-ink-soft mb-1.5"
                  >
                    Confirm new password
                  </label>
                  <div className="relative">
                    <input
                      id="client-confirm-password"
                      name="account_confirm_password"
                      type={showConfirmNewPassword ? "text" : "password"}
                      autoComplete="new-password"
                      maxLength={PASSWORD_MAX_LENGTH}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 pr-10 text-sm text-ink placeholder:text-ink-soft/40 focus:border-navy-deep focus:outline-none focus:ring-2 focus:ring-navy-deep/10 transition-all shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmNewPassword((prev) => !prev)
                      }
                      aria-label={
                        showConfirmNewPassword
                          ? "Hide confirm new password"
                          : "Show confirm new password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-soft/50 hover:text-ink cursor-pointer focus:outline-none"
                    >
                      {showConfirmNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {errors.confirmNewPassword && (
                    <p className="mt-1 text-xs text-maroon font-medium">
                      {errors.confirmNewPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-semibold text-ink-soft transition-all hover:bg-parchment/60 hover:text-ink cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-maroon px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-parchment shadow-xs transition-all hover:bg-maroon-bright active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="h-3.5 w-3.5 animate-spin text-parchment"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5"
                  >
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  <span>Save changes</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right column: sidebar */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-6">
          {/* Account Profile Card */}
          <div className="rounded-2xl border border-line bg-white p-5 shadow-xs">
            <div className="flex items-center gap-3.5 pb-4 border-b border-line">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold text-navy-deep font-bold text-sm shadow-xs ring-2 ring-white">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <h3
                  className="font-semibold text-navy-deep text-sm truncate"
                  title={`${firstName} ${lastName}`.trim()}
                >
                  {`${firstName} ${lastName}`.trim() || "Client User"}
                </h3>
                <p className="text-xs text-ink-soft truncate mt-0.5">
                  {email || "client@lingkodbatas.ph"}
                </p>
              </div>
            </div>

            <dl className="mt-3.5 flex flex-col gap-2.5 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-ink-soft">Account Type</dt>
                <dd className="rounded-full bg-navy/10 px-2.5 py-0.5 text-[11px] font-semibold text-navy">
                  Client
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-soft">Status</dt>
                <dd className="flex items-center gap-1.5 font-medium text-ink text-[11.5px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active
                </dd>
              </div>
            </dl>
          </div>

          {/* Notification Preferences */}
          <div className="rounded-2xl border border-line bg-white p-5 shadow-xs">
            <h2 className="text-sm font-semibold text-navy-deep tracking-tight mb-1">
              Notification preferences
            </h2>
            <p className="text-xs text-ink-soft mb-4">
              Control where and how you receive alerts.
            </p>
            <div className="flex flex-col gap-4 divide-y divide-line">
              <div>
                <Toggle
                  label="Email notifications"
                  description="Status milestones and attorney review sign-offs"
                  checked={emailNotifications}
                  onChange={setEmailNotifications}
                />
              </div>
              <div className="pt-3.5">
                <Toggle
                  label="In-app notifications"
                  description="Real-time alerts while you're active on the platform"
                  checked={inAppNotifications}
                  onChange={setInAppNotifications}
                />
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-2xl border border-maroon/20 bg-maroon/5 p-5 shadow-xs">
            <h2 className="text-sm font-semibold text-maroon mb-1">
              Delete account
            </h2>
            <p className="text-xs text-maroon/80 mb-4 leading-relaxed">
              Permanently removes your account profile and all contract records. This action cannot be undone.
            </p>
            <button
              type="button"
              onClick={handleDeleteAccount}
              className="w-full rounded-xl border border-maroon/30 bg-white px-3.5 py-2 text-xs font-semibold text-maroon hover:bg-maroon hover:text-parchment transition-all shadow-2xs cursor-pointer"
            >
              Delete my account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientAccountPage;
