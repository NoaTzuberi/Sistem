interface RegisterInput {
  name?: string;
  email?: string;
  password?: string;
}

interface LoginInput {
  email?: string;
  password?: string;
}

interface ForgotPasswordInput {
  email?: string;
}

interface ResetPasswordInput {
  token?: string;
  password?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function validateRegisterInput(input: RegisterInput): string | null {
  const { name, email, password } = input;

  if (typeof name !== 'string' || name.trim().length === 0) {
    return 'Name is required.';
  }
  if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
    return 'A valid email is required.';
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  return null;
}

export function validateLoginInput(input: LoginInput): string | null {
  const { email, password } = input;

  if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
    return 'A valid email is required.';
  }
  if (typeof password !== 'string' || password.length === 0) {
    return 'Password is required.';
  }

  return null;
}

export function validateForgotPasswordInput(input: ForgotPasswordInput): string | null {
  if (typeof input.email !== 'string' || !EMAIL_REGEX.test(input.email)) {
    return 'A valid email is required.';
  }

  return null;
}

export function validateResetPasswordInput(input: ResetPasswordInput): string | null {
  if (typeof input.token !== 'string' || input.token.trim().length === 0) {
    return 'Reset token is required.';
  }
  if (typeof input.password !== 'string' || input.password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  return null;
}
