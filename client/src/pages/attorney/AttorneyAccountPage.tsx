import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { mockCurrentAttorney } from "../../mocks/attorney.js";
import {
  validateEmail,
  validateName,
  validateLoginPassword,
  validateNewPassword,
  validateConfirmPassword,
} from "../../utils/validation.js";

interface FormErrors {
  firstName?: string | undefined;
  lastName?: string | undefined;
  email?: string | undefined;
  currentPassword?: string | undefined;
  newPassword?: string | undefined;
  confirmNewPassword?: string | undefined;
}

/**
 * Attorney Account management screen matching Lingkod Batas design system.
 */
function AttorneyAccountPage() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState(mockCurrentAttorney.firstName);
  const [lastName, setLastName] = useState(mockCurrentAttorney.lastName);
  const [email, setEmail] = useState(mockCurrentAttorney.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const isChangingPassword =
    currentPassword !== "" || newPassword !== "" || confirmNewPassword !== "";

  function validate(): FormErrors {
    const nextErrors: FormErrors = {
      firstName: validateName(firstName, "First name"),
      lastName: validateName(lastName, "Last name"),
      email: validateEmail(email),
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setIsSubmitting(true);
    setSavedSuccess(false);

    window.setTimeout(() => {
      setIsSubmitting(false);
      setSavedSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    }, 700);
  }

  function handleCancel() {
    setFirstName(mockCurrentAttorney.firstName);
    setLastName(mockCurrentAttorney.lastName);
    setEmail(mockCurrentAttorney.email);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setErrors({});
    setSavedSuccess(false);
  }

  function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Permanently delete your account and all uploaded contracts? This cannot be undone.",
    );
    if (!confirmed) return;
    navigate("/");
  }

  return (
    <div className="max-w-[1040px]">
      <h1 className="font-serif text-[24px] font-medium tracking-[-0.01em] text-navy-deep mb-1">
        Account settings
      </h1>
      <p className="text-[13px] leading-[1.4] text-ink-soft mb-4">
        Manage your attorney profile details, credentials, and security.
      </p>

      {savedSuccess && (
        <div className="mb-4 rounded-[6px] border border-green/30 bg-green/10 p-2.5 text-xs text-green font-mono">
          ✓ Changes saved successfully.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        {/* Left column: main form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Profile Card */}
          <div className="rounded-[8px] border border-line bg-white p-5 shadow-2xs">
            <h2 className="font-serif text-[15px] font-medium text-navy-deep mb-4">
              Profile details
            </h2>
            <div className="flex flex-col gap-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="mb-1 block font-mono text-[10.5px] font-medium tracking-[0.05em] text-ink-soft uppercase">
                    First name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-[6px] border border-line bg-white px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-maroon">
                      {errors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block font-mono text-[10.5px] font-medium tracking-[0.05em] text-ink-soft uppercase">
                    Last name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-[6px] border border-line bg-white px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-xs text-maroon">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="mb-1 block font-mono text-[10.5px] font-medium tracking-[0.05em] text-ink-soft uppercase">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-[6px] border border-line bg-white px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-maroon">{errors.email}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block font-mono text-[10.5px] font-medium tracking-[0.05em] text-ink-soft uppercase">
                    Roll of Attorneys No.
                  </label>
                  <input
                    type="text"
                    disabled
                    value="123456"
                    className="w-full rounded-[6px] border border-line bg-parchment-dark/30 px-3 py-2 font-mono text-sm text-ink-soft opacity-70 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="rounded-[8px] border border-line bg-white p-5 shadow-2xs">
            <h2 className="font-serif text-[15px] font-medium text-navy-deep mb-4">
              Change password
            </h2>
            <div className="flex flex-col gap-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="mb-1 block font-mono text-[10.5px] font-medium tracking-[0.05em] text-ink-soft uppercase">
                    Current password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full rounded-[6px] border border-line bg-white px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
                  />
                  {errors.currentPassword && (
                    <p className="mt-1 text-xs text-maroon">
                      {errors.currentPassword}
                    </p>
                  )}
                </div>
                <div />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="mb-1 block font-mono text-[10.5px] font-medium tracking-[0.05em] text-ink-soft uppercase">
                    New password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-[6px] border border-line bg-white px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
                  />
                  {errors.newPassword && (
                    <p className="mt-1 text-xs text-maroon">
                      {errors.newPassword}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block font-mono text-[10.5px] font-medium tracking-[0.05em] text-ink-soft uppercase">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full rounded-[6px] border border-line bg-white px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
                  />
                  {errors.confirmNewPassword && (
                    <p className="mt-1 text-xs text-maroon">
                      {errors.confirmNewPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-[5px] border border-line bg-white px-4 py-2 text-[13.5px] font-semibold text-ink transition-colors hover:border-ink cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-[5px] bg-maroon px-4 py-2 text-[13.5px] font-semibold text-parchment transition-colors hover:bg-maroon-bright disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? "Saving changes…" : "Save changes"}
            </button>
          </div>
        </form>

        {/* Right column: sidebar */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-6">
          <div className="rounded-[8px] border border-line bg-white p-5 shadow-2xs">
            <h2 className="font-serif text-[15px] font-medium text-navy-deep mb-3">
              Account overview
            </h2>
            <dl className="flex flex-col gap-2.5 text-[13px]">
              <div className="flex items-center justify-between">
                <dt className="text-ink-soft">Name</dt>
                <dd className="font-medium text-ink">
                  {firstName} {lastName}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-soft">Roll No.</dt>
                <dd className="font-mono text-ink">123456</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-soft">Status</dt>
                <dd className="font-medium text-green">Verified</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-[8px] border border-maroon/25 bg-maroon/[0.02] p-5 shadow-2xs">
            <h2 className="font-serif text-[15px] font-medium text-maroon mb-1.5">
              Delete account
            </h2>
            <p className="text-[13px] text-ink-soft mb-4 leading-[1.4]">
              Permanently removes your account and all associated contracts from
              the system. This action cannot be undone.
            </p>
            <button
              type="button"
              onClick={handleDeleteAccount}
              className="w-full rounded-[5px] border border-maroon/40 bg-transparent px-4 py-2 text-[12.5px] font-semibold text-maroon hover:bg-maroon hover:text-white transition-colors cursor-pointer"
            >
              Delete my account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttorneyAccountPage;
