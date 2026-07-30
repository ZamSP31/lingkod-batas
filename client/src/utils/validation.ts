import type { LoginFormErrors, LoginFormValues } from "../types/auth.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const EMAIL_MAX_LENGTH = 50;
export const PASSWORD_MAX_LENGTH = 50;

export function validateLoginForm(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {};
  const email = values.email.trim();

  if (!email) {
    errors.email = "Enter your email address.";
  } else if (email.length > EMAIL_MAX_LENGTH) {
    errors.email = `Email address must be ${EMAIL_MAX_LENGTH} characters or fewer.`;
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Enter your password.";
  } else if (values.password.length > PASSWORD_MAX_LENGTH) {
    errors.password = `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`;
  }

  return errors;
}
