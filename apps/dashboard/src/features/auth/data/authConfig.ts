/**
 * Two controls of the login design that have nothing behind them yet. They are built and stay
 * hidden until the feature exists — a control that does nothing is worse than none.
 */

/**
 * "Keep me signed in". TODO: the dashboard always keeps the session (the token lives in
 * localStorage, services/auth/tokenStorage.ts) — there is no remember-me choice in the auth yet.
 * Turn this on together with a session-only token option.
 */
export const REMEMBER_ME_ENABLED = false;

/**
 * The "forgot" pill inside the password field. TODO: the dashboard has no forgot-password screen
 * (password reset is backlog). Turn this on with that screen and give the pill its route.
 */
export const FORGOT_PASSWORD_ENABLED = false;
