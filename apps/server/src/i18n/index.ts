import type { Request, Response } from 'express';
import type { Language } from '@sistem/types';
import { en } from './locales/en';
import { he } from './locales/he';

// Server-built texts (Phase 15). Every error and validation problem is a stable `code` (+ params);
// the words are picked per response from the request's language (Accept-Language — the clients
// send the language on screen), or per user (User.preferences.language) for texts sent outside a
// request (email; Phase 5b push). Hebrew is the default. The same key-parity test as the clients
// checks he.ts / en.ts.

export type MessageCode = keyof typeof he;
/** A param may itself be a message (a field label) or a list of them, worded in the same language. */
export type MessageParams = Record<string, string | number | ServerMessage | ServerMessage[]>;

export interface ServerMessage {
  code: MessageCode;
  params?: MessageParams;
}

const CATALOGS: Record<Language, Record<MessageCode, string>> = { he, en };

export function msg(code: MessageCode, params?: MessageParams): ServerMessage {
  return params ? { code, params } : { code };
}

export function translate(language: Language, message: ServerMessage | MessageCode): string {
  const { code, params } = typeof message === 'string' ? { code: message, params: undefined } : message;
  const template = CATALOGS[language][code] ?? code;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (!(key in params)) return match;
    const value = params[key];
    if (Array.isArray(value)) return value.map((item) => translate(language, item)).join(', ');
    return typeof value === 'object' ? translate(language, value) : String(value);
  });
}

/** The request's language: the first of he / en the client accepts; Hebrew when it says nothing. */
export function requestLanguage(req: Request | undefined): Language {
  // No request (a hand-built response in a unit test): the default.
  const accepted = req?.acceptsLanguages?.('he', 'en');
  return accepted === 'en' ? 'en' : 'he';
}

/** `{ code, message }` (+ any extra fields) with the message in the request's language. */
export function sendError(res: Response, status: number, message: ServerMessage | MessageCode, extra: object = {}): void {
  const code = typeof message === 'string' ? message : message.code;
  res.status(status).json({ code, message: translate(requestLanguage(res.req), message), ...extra });
}

/** A success body that carries a sentence (forgot / reset password). */
export function messageBody(res: Response, message: ServerMessage | MessageCode): { code: MessageCode; message: string } {
  const code = typeof message === 'string' ? message : message.code;
  return { code, message: translate(requestLanguage(res.req), message) };
}

/**
 * An error a controller turns into a response: thrown with a code, worded at send time. The
 * Error's own message is the code (logs stay readable, no language needed there).
 */
export class LocalizedError extends Error {
  readonly serverMessage: ServerMessage;

  constructor(message: MessageCode | ServerMessage, params?: MessageParams) {
    const serverMessage = typeof message === 'string' ? msg(message, params) : message;
    super(serverMessage.code);
    this.serverMessage = serverMessage;
  }
}

/** A list of problems with indexes (plan / nutrition issues): each gets its `message` in the request's language. */
export function localizeIssues<T extends ServerMessage>(issues: T[], language: Language): (Omit<T, 'params'> & { message: string })[] {
  return issues.map(({ params, ...issue }) => ({ ...issue, message: translate(language, { code: issue.code, params }) }));
}
