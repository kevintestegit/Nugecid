import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://127.0.0.1:3001';

const routes = (process.env.E2E_ROUTES || '/,/desarquivamentos,/arquivo')
  .split(',')
  .map((route) => route.trim())
  .filter(Boolean);

function safeName(route: string): string {
  return route.replace(/[^a-zA-Z0-9_-]/g, '_') || 'home';
}

for (const route of routes) {
  test(`Hermes smoke: ${route}`, async ({ page }) => {
    const url = new URL(route, BASE_URL).toString();

    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    const status = response?.status() ?? 0;
    expect(status, `HTTP status de ${url}`).toBeLessThan(500);

    await page.waitForTimeout(1500);

    const title = await page.title().catch(() => '');
    const bodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');

    expect(bodyText.toLowerCase()).not.toContain('internal server error');
    expect(bodyText.toLowerCase()).not.toContain('application error');
    expect(bodyText.toLowerCase()).not.toContain('cannot get');
    expect(bodyText.toLowerCase()).not.toContain('unhandled');

    await page.screenshot({
      path: `test-results/hermes-smoke-${safeName(route)}.png`,
      fullPage: true,
    });

    console.log(JSON.stringify({
      route,
      url,
      status,
      title,
      finalUrl: page.url(),
    }));
  });
}
