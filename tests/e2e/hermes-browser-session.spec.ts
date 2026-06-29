import { test } from '@playwright/test';

test('hermes-browser-session', async ({ page }) => {
  await page.goto('http://127.0.0.1:3001/login');
  
  // Mantém a página aberta por 5 minutos para interação
  await page.waitForTimeout(300000);
});
