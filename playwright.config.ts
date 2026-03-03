import { defineConfig, devices } from "@playwright/test";

const backendPort = Number(process.env.E2E_BACKEND_PORT || 3100);
const frontendPort = Number(process.env.E2E_FRONTEND_PORT || 3101);
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${frontendPort}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
  ],
  expect: {
    timeout: 15000,
  },
  use: {
    baseURL,
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: [
    {
      command: "bash scripts/start-backend-e2e.sh",
      url: `http://127.0.0.1:${backendPort}/ready`,
      reuseExistingServer: false,
      timeout: 180000,
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      command: "bash scripts/start-frontend-e2e.sh",
      url: `${baseURL}/login`,
      reuseExistingServer: false,
      timeout: 120000,
      stdout: "pipe",
      stderr: "pipe",
    },
  ],
});
