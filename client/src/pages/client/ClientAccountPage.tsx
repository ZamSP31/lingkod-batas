import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.js";
import Card from "../../components/ui/Card.js";
import TextField from "../../components/ui/TextField.js";
import PasswordField from "../../components/ui/PasswordField.js";
import Toggle from "../../components/ui/Toggle.js";
import { mockCurrentClient } from "../../mocks/client.js";
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
 * "Account" — the client-facing counterpart to AttorneyAccountPage.
 * Same profile + password pattern, plus a contact number field and a
 * notification preferences card that don't apply to the attorney role.
 * Password fields are optional here: leaving all three blank just saves
 * the profile fields and leaves the password untouched.
 */
function ClientAccountPage() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState(mockCurrentClient.firstName);
  const [lastName, setLastName] = useState(mockCurrentClient.lastName);
  const [email, setEmail] = useState(mockCurrentClient.email);
  const [contactNumber, setContactNumber] = useState(
    mockCurrentClient.contactNumber,
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isChangingPassword =
    currentPassword !== "" || newPassword !== "" || confirmNewPassword !== "";

  function validate(): FormErrors {
    const nextErrors: FormErrors = {
      firstName: validateName(firstName, "First name"),
      lastName: validateName(lastName, "Last name"),
      email: validateEmail(email),
    };

    // Password fields are only required (and validated) once the
    // client starts filling any one of the three — leaving all three
    // blank means "don't change my password."
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
    // TODO: replace with the real PATCH /api/users/me (and password
    // change endpoint, if isChangingPassword) once the API exists.
    window.setTimeout(() => {
      setIsSubmitting(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    }, 700);
  }

  function handleCancel() {
    setFirstName(mockCurrentClient.firstName);
    setLastName(mockCurrentClient.lastName);
    setEmail(mockCurrentClient.email);
    setContactNumber(mockCurrentClient.contactNumber);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setErrors({});
  }

  function handleDeleteAccount() {
    // TODO: replace window.confirm with a proper confirmation modal
    // once that component exists — this is a functional stand-in for now.
    const confirmed = window.confirm(
      "Permanently delete your account and all submitted contracts? This cannot be undone.",
    );
    if (!confirmed) return;

    setIsDeleting(true);
    // TODO: replace with the real DELETE /api/users/me once the API exists.
    window.setTimeout(() => {
      navigate("/");
    }, 700);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-navy-950">
        Account
      </h1>
      <p className="mt-1 text-sm text-ink-600">
        Manage your profile and login details
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
        <Card title="Profile">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                label="First name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                error={errors.firstName}
              />
              <TextField
                label="Last name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                error={errors.lastName}
              />
            </div>
            <TextField
              label="Email address"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={errors.email}
            />
            <TextField
              label="Contact number"
              type="tel"
              value={contactNumber}
              onChange={(event) => setContactNumber(event.target.value)}
            />
          </div>
        </Card>

        <Card title="Change password">
          <div className="flex flex-col gap-4">
            <PasswordField
              label="Current password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              error={errors.currentPassword}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <PasswordField
                label="New password"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                error={errors.newPassword}
              />
              <PasswordField
                label="Confirm new password"
                placeholder="Re-enter password"
                autoComplete="new-password"
                value={confirmNewPassword}
                onChange={(event) => setConfirmNewPassword(event.target.value)}
                error={errors.confirmNewPassword}
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            fullWidth={false}
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button type="submit" fullWidth={false} isLoading={isSubmitting}>
            Save changes
          </Button>
        </div>
      </form>

      <div className="mt-6">
        <Card title="Notification preferences">
          <div className="flex flex-col gap-4">
            <Toggle
              label="Email notifications"
              description="Contract updates and attorney review status"
              checked={emailNotifications}
              onChange={setEmailNotifications}
            />
            <Toggle
              label="In-app notifications"
              description="Real time alerts while you're signed in"
              checked={inAppNotifications}
              onChange={setInAppNotifications}
            />
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card
          title="Delete account"
          description="Permanently removes your account and all submitted contracts. This cannot be undone."
          tone="danger"
        >
          <Button
            type="button"
            variant="danger"
            fullWidth={false}
            isLoading={isDeleting}
            onClick={handleDeleteAccount}
          >
            Delete my account
          </Button>
        </Card>
      </div>
    </div>
  );
}

export default ClientAccountPage;