import { extractErrorMessage } from '@sistem/api-client';

/** The server's own words when it refused (nutrition calls throw an Error carrying them), else the fallback. */
export function errorText(failure: unknown, fallback: string): string {
  if (failure instanceof Error && failure.message) return failure.message;
  return extractErrorMessage(failure, fallback);
}
