import { expect, test, type Page } from "@playwright/test";

const adminUser = process.env.E2E_ADMIN_USERNAME || "admin";
const adminPassword = process.env.E2E_ADMIN_PASSWORD || "123456";

async function login(page: Page) {
  await page.goto("/login");

  await expect(
    page.getByRole("heading", { name: /acesse sua conta/i }),
  ).toBeVisible();

  await page.locator("#usuario").fill(adminUser);
  await page.locator("#senha").fill(adminPassword);
  await page.getByRole("button", { name: /entrar/i }).click();

  await expect(page).toHaveURL(/\/$/);
}

test.describe("Autenticação e acesso inicial", () => {
  test("admin consegue entrar e carregar o dashboard", async ({ page }) => {
    await login(page);

    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByText(
        "Bem-vindo ao Sistema de Gerenciamento Eletrônico de Documentos - GED",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /administrador/i }),
    ).toBeVisible();
  });

  test("admin acessa a página de auditoria", async ({ page }) => {
    await login(page);

    await page.goto("/auditoria");

    await expect(page).toHaveURL(/\/auditoria$/);
    await expect(
      page.getByRole("heading", { name: "Auditoria" }),
    ).toBeVisible();
    await expect(page.getByText("Rastreabilidade operacional")).toBeVisible();
  });
});
