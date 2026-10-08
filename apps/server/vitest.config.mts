import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    testTimeout: 30000,
    // Tests never call a real AI / embeddings API: empty keys win over apps/server/.env (dotenv
    // never overrides a variable that is already set). AI tests fake the client instead.
    // Feature flags start closed in every test (a test opens one with setFeatureFlagsForTests).
    env: {
      GEMINI_API_KEY: '',
      AI_MODEL: '',
      AI_FALLBACK_MODEL: '',
      VOYAGE_API_KEY: '',
      FEATURE_NUTRITION_RECIPES: '',
      FEATURE_MEAL_LOGGING: '',
      FEATURE_WATER_TRACKING: '',
    },
  },
});
