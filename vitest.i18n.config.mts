import { defineConfig } from 'vitest/config';

// The copy parity check (Phase 15): `npm run test:i18n`, also part of `npm test`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['scripts/i18n-parity.test.ts'],
  },
});
