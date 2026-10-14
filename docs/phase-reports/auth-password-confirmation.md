# Password confirmation on registration and reset

## Summary

- Added a confirmation field to trainee registration and retained the existing confirmation field on password reset.
- Both forms validate confirmation on blur and submit, show the match state in Cherry Rose and mismatches in the existing error style, and keep submit disabled until valid.
- Added show/hide controls to both password fields in each form, with localized accessible labels and `aria-pressed` state. Both fields use `autocomplete="new-password"`.
- Registration and password reset send the confirmation value. Server validation rejects a mismatch whenever `confirmPassword` is present; older clients that omit it remain compatible.
- No separate coach set-password page exists yet.

## Files changed

- `apps/mobile/src/features/auth/pages/Register/Register.tsx`
- `apps/mobile/src/features/auth/pages/ResetPassword/ResetPassword.tsx`
- `apps/mobile/src/features/auth/components/AuthField/AuthField.tsx` and `.css`
- `apps/mobile/src/features/auth/components/PasswordVisibilityToggle/PasswordVisibilityToggle.tsx` and `.css`
- `apps/mobile/src/features/auth/components/AuthSubmitButton/AuthSubmitButton.tsx` and `.css`
- `apps/mobile/src/components/common/Input/Input.tsx` and `.css`
- `apps/mobile/src/features/auth/validation.ts`
- `apps/mobile/src/features/auth/copy/he.ts` and `en.ts`
- `apps/mobile/src/services/auth/AuthContext.tsx`
- `packages/api-client/src/authApi.ts`
- `packages/types/src/index.ts`
- `apps/server/src/features/auth/auth.validation.ts`
- `apps/server/src/i18n/locales/he.ts` and `en.ts`

## Verification

`npm run build -w @sistem/mobile` and `npm run build -w @sistem/server` succeeded. The mobile build reported its existing-style large bundle warning (main JS chunk is over 500 kB). Tests were not run.

## Suggested commit commands

After reviewing the staged paths, run:

```sh
git add apps/mobile/src/features/auth/pages/Register/Register.tsx apps/mobile/src/features/auth/pages/ResetPassword/ResetPassword.tsx apps/mobile/src/features/auth/components/AuthField/AuthField.tsx apps/mobile/src/features/auth/components/AuthField/AuthField.css apps/mobile/src/features/auth/components/PasswordVisibilityToggle apps/mobile/src/features/auth/components/AuthSubmitButton/AuthSubmitButton.tsx apps/mobile/src/features/auth/components/AuthSubmitButton/AuthSubmitButton.css apps/mobile/src/components/common/Input/Input.tsx apps/mobile/src/components/common/Input/Input.css apps/mobile/src/features/auth/validation.ts apps/mobile/src/features/auth/copy/he.ts apps/mobile/src/features/auth/copy/en.ts apps/mobile/src/services/auth/AuthContext.tsx packages/api-client/src/authApi.ts packages/types/src/index.ts apps/server/src/features/auth/auth.validation.ts apps/server/src/i18n/locales/he.ts apps/server/src/i18n/locales/en.ts docs/phase-reports/auth-password-confirmation.md
git commit -m "feat(auth): confirm passwords on signup and reset"
```
