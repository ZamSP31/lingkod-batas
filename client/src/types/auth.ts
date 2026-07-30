export interface LoginFormValues {
  email: string;
  password: string;
}

export interface LoginFormErrors {
  email?: string | undefined;
  password?: string | undefined;
  form?: string | undefined;
}

export interface RegisterFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterFormErrors {
  firstName?: string | undefined;
  lastName?: string | undefined;
  email?: string | undefined;
  password?: string | undefined;
  confirmPassword?: string | undefined;
  form?: string | undefined;
}

export interface ForgotPasswordFormValues {
  email: string;
}

export interface ForgotPasswordFormErrors {
  email?: string | undefined;
  form?: string | undefined;
}
