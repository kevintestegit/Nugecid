import { defineConfig, devices } from '@playwright/test';

const slowMo = Number(process.env.E2E_SLOWMO_MS || '0');
const width = Number(process.env.E2E_WIDTH || '900');
const height = Number(process.env.E2E_HEIGHT || '650');

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90000,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  workers: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:3001',
    viewport: { width, height },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    launchOptions: {
      slowMo,
      args: [`--window-size=${width},${height}`],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width, height } },
    },
  ],
});
