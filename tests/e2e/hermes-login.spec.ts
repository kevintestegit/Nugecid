import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://127.0.0.1:3001';
const USER = process.env.SGC_BOT_USER || 'hermes';
const PASSWORD = process.env.SGC_BOT_PASSWORD || '';

test('Hermes login visível no SGC', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

  const usuario = page.getByLabel(/usuário|usuario|login|matrícula|matricula/i).first();
  const senha = page.getByLabel(/senha/i).first();

  await usuario.fill(USER);
  await senha.fill(PASSWORD);

  await page.getByRole('button', { name: /entrar|login|acessar/i }).click();

  await page.waitForTimeout(2000);

  await expect(page).not.toHaveURL(/\/login/i);

  await page.screenshot({
    path: 'test-results/hermes-login-ok.png',
    fullPage: true,
  });
});
