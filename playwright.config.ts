import { defineConfig, devices } from '@playwright/test';

/**
 * LocalConnect E2E test configuration.
 * Run: npx playwright test
 * Docs: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: './e2e',
    /* Maximum time for a single test (ms) */
    timeout: 30_000,
    /* Fail fast on CI */
    forbidOnly: !!process.env.CI,
    /* Retry failed tests once on CI */
    retries: process.env.CI ? 1 : 0,
    /* Parallel workers */
    workers: process.env.CI ? 2 : undefined,
    /* Reporter */
    reporter: 'html',

    use: {
        /* Base URL — matches the Vite dev server default */
        baseURL: process.env.BASE_URL || 'http://localhost:5173',
        /* Capture screenshot on failure */
        screenshot: 'only-on-failure',
        /* Record trace on retry */
        trace: 'on-first-retry',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
