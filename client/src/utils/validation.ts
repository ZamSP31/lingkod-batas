import type {
  ForgotPasswordFormErrors,
  ForgotPasswordFormValues,
  LoginFormErrors,
  LoginFormValues,
  RegisterFormErrors,
  RegisterFormValues,
} from "../types/auth.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const EMAIL_MAX_LENGTH = 50;
export const PASSWORD_MAX_LENGTH = 50;
export const NAME_MAX_LENGTH = 50;
export const CONTACT_MAX_LENGTH = 20;

// Matches the mockup's own placeholder copy ("At least 8 characters").
export const PASSWORD_MIN_LENGTH = 8;

export function validateContactNumber(
  contactNumber: string,
  required: boolean = false,
): string | undefined {
  const trimmed = contactNumber.trim();
  if (!trimmed) {
    if (required) return "Enter your contact number.";
    return undefined;
  }
  if (trimmed.length > CONTACT_MAX_LENGTH) {
    return `Contact number must be ${CONTACT_MAX_LENGTH} characters or fewer.`;
  }
  // Philippine mobile pattern: +639XXXXXXXXX or 09XXXXXXXXX, or general digits
  const cleaned = trimmed.replace(/[\s-]/g, "");
  if (!/^(09|\+639)\d{9}$/.test(cleaned) && !/^\+?\d{7,15}$/.test(cleaned)) {
    return "Enter a valid contact number (e.g., 0917 123 4567 or +63 917 123 4567).";
  }
  return undefined;
}

// --- Single-field validators -------------------------------------------
// Shared by the full-form validators below AND by the live, per-keystroke
// validation each page runs to decide a field's green/red border state.

export function validateEmail(email: string): string | undefined {
  const trimmed = email.trim();
  if (!trimmed) return "Enter your email address.";
  if (trimmed.length > EMAIL_MAX_LENGTH) {
    return `Email address must be ${EMAIL_MAX_LENGTH} characters or fewer.`;
  }
  if (!EMAIL_PATTERN.test(trimmed)) return "Enter a valid email address.";
  return undefined;
}

export function validateLoginPassword(password: string): string | undefined {
  if (!password) return "Enter your password.";
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`;
  }
  return undefined;
}

export function validateName(name: string, label: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) return `Enter your ${label.toLowerCase()}.`;
  if (trimmed.length > NAME_MAX_LENGTH) {
    return `${label} must be ${NAME_MAX_LENGTH} characters or fewer.`;
  }
  return undefined;
}

export function validateNewPassword(password: string): string | undefined {
  if (!password) return "Enter a password.";
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`;
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must include at least one uppercase letter.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must include at least one lowercase letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must include at least one number.";
  }
  return undefined;
}

export function validateConfirmPassword(
  password: string,
  confirmPassword: string,
): string | undefined {
  if (!confirmPassword) return "Re-enter your password.";
  if (confirmPassword !== password) return "Passwords do not match.";
  return undefined;
}

// --- Full-form validators (used on submit) ------------------------------

export function validateLoginForm(values: LoginFormValues): LoginFormErrors {
  return {
    email: validateEmail(values.email),
    password: validateLoginPassword(values.password),
  };
}

export function validateRegisterForm(
  values: RegisterFormValues,
): RegisterFormErrors {
  return {
    firstName: validateName(values.firstName, "First name"),
    lastName: validateName(values.lastName, "Last name"),
    email: validateEmail(values.email),
    password: validateNewPassword(values.password),
    confirmPassword: validateConfirmPassword(
      values.password,
      values.confirmPassword,
    ),
  };
}

export function validateForgotPasswordForm(
  values: ForgotPasswordFormValues,
): ForgotPasswordFormErrors {
  return {
    email: validateEmail(values.email),
  };
}

/** True if any field in a validation-errors object actually holds a message. */
export function hasValidationErrors(
  errors: LoginFormErrors | RegisterFormErrors | ForgotPasswordFormErrors,
): boolean {
  return Object.values(errors).some((message) => Boolean(message));
}
