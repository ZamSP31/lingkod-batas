export interface LoginFormValues {
  email: string;
  password: string;
}

export interface LoginFormErrors {
  email?: string | undefined;
  password?: string | undefined;
  form?: string | undefined;
}
