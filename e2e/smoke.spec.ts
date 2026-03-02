import { test, expect } from '@playwright/test';

/**
 * Smoke test: verifies the two critical entry-point screens of LocalConnect.
 *
 * Covers Recommendation 8: E2E test setup (Playwright).
 * Document reference: Section 5.6 "End-to-End Test Flows"
 *   - Flow 1: Onboarding screen renders on first visit
 *   - Flow 2: Auth screen renders and contains login form
 */

test.describe('LocalConnect smoke tests', () => {
    test('onboarding screen renders on root path', async ({ page }) => {
        await page.goto('/');

        // The onboarding screen should be visible — check for the heading or CTA
        await expect(page).toHaveTitle(/LocalConnect/i);

        // The root path should render OnboardingScreen, not a blank page or 404
        const body = page.locator('body');
        await expect(body).not.toBeEmpty();

        // Should NOT show a 404 / NotFound message
        await expect(page.getByText(/page not found/i)).not.toBeVisible();
    });

    test('auth screen contains login form', async ({ page }) => {
        await page.goto('/auth');

        // The auth screen must have an email input and a password input
        await expect(page.getByLabel(/email/i)).toBeVisible();
        await expect(page.getByLabel(/password/i)).toBeVisible();

        // There should be a submit / login button
        const loginBtn = page.getByRole('button', { name: /login|sign in/i });
        await expect(loginBtn).toBeVisible();
    });

    test('marketplace route redirects unauthenticated users', async ({ page }) => {
        await page.goto('/marketplace');

        // Unauthenticated users should be redirected to auth or onboarding
        await expect(page).not.toHaveURL('/marketplace');
    });
});
