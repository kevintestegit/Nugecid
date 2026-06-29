import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://127.0.0.1:3001';
const USER = process.env.SGC_BOT_USER || 'hermes';
const PASSWORD = process.env.SGC_BOT_PASSWORD || '';

const routes = (process.env.E2E_ROUTES || '/,/desarquivamentos,/arquivo,/usuarios')
  .split(',')
  .map((route) => route.trim())
  .filter(Boolean);

function safeName(route: string): string {
  return route.replace(/[^a-zA-Z0-9_-]/g, '_') || 'home';
}

async function loginUmaVez(page: Page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

  const usuario = page.getByLabel(/usuário|usuario|login|matrícula|matricula/i).first();
  const senha = page.getByLabel(/senha/i).first();

  await usuario.fill(USER);
  await senha.fill(PASSWORD);

  await page.getByRole('button', { name: /entrar|login|acessar/i }).click();

  await expect(page).not.toHaveURL(/\/login/i, { timeout: 10000 });
}

test('Hermes fluxo autenticado único no SGC', async ({ page }) => {
  if (!PASSWORD) {
    throw new Error('SGC_BOT_PASSWORD não foi carregada.');
  }

  await loginUmaVez(page);

  await page.screenshot({
    path: 'test-results/hermes-auth-login-ok.png',
    fullPage: true,
  });

  for (const route of routes) {
    const url = new URL(route, BASE_URL).toString();

    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    const status = response?.status() ?? 0;
    expect(status, `HTTP status de ${url}`).toBeLessThan(500);

    await page.waitForTimeout(1000);

    const finalUrl = page.url();

    if (/\/login/i.test(finalUrl)) {
      throw new Error(`A rota ${route} redirecionou para login. A sessão pode ter expirado ou a rota exige permissão.`);
    }

    const bodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');

    expect(bodyText.toLowerCase()).not.toContain('internal server error');
    expect(bodyText.toLowerCase()).not.toContain('application error');
    expect(bodyText.toLowerCase()).not.toContain('cannot get');
    expect(bodyText.toLowerCase()).not.toContain('unhandled');

    await page.screenshot({
      path: `test-results/hermes-auth-${safeName(route)}.png`,
      fullPage: true,
    });

    console.log(JSON.stringify({
      route,
      url,
      status,
      finalUrl,
    }));
  }
});
