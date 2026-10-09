import { fill } from '@sistem/shared';
import type { authCopy } from './copy';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;

// Each check answers the key of its message (copy errors), so the text follows the language
// on screen even after a switch.
export type AuthErrorKey = keyof (typeof authCopy)['he']['errors'];

export function validateName(name: string): AuthErrorKey | undefined {
  return name.trim().length === 0 ? 'nameRequired' : undefined;
}

export function validateEmail(email: string): AuthErrorKey | undefined {
  return EMAIL_REGEX.test(email) ? undefined : 'emailInvalid';
}

export function validatePassword(password: string): AuthErrorKey | undefined {
  return password.length < MIN_PASSWORD_LENGTH ? 'passwordTooShort' : undefined;
}

export function validateLoginPassword(password: string): AuthErrorKey | undefined {
  return password.length === 0 ? 'passwordRequired' : undefined;
}

export function validateConfirmPassword(password: string, confirmPassword: string): AuthErrorKey | undefined {
  return confirmPassword !== password ? 'passwordsDiffer' : undefined;
}

/** The message of a key in the given copy ({min} filled). */
export function authErrorText(copy: (typeof authCopy)['he'], key: AuthErrorKey | undefined): string | undefined {
  return key ? fill(copy.errors[key], { min: MIN_PASSWORD_LENGTH }) : undefined;
}
