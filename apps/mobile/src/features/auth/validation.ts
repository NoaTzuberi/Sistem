const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function validateName(name: string): string | undefined {
  if (name.trim().length === 0) {
    return 'Name is required.';
  }
  return undefined;
}

export function validateEmail(email: string): string | undefined {
  if (!EMAIL_REGEX.test(email)) {
    return 'Enter a valid email address.';
  }
  return undefined;
}

export function validatePassword(password: string): string | undefined {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return undefined;
}

export function validateLoginPassword(password: string): string | undefined {
  if (password.length === 0) {
    return 'Password is required.';
  }
  return undefined;
}

export function validateConfirmPassword(password: string, confirmPassword: string): string | undefined {
  if (confirmPassword !== password) {
    return 'Passwords do not match.';
  }
  return undefined;
}
