import { expect, test } from "@playwright/test";

// Banco SQLite descartável (ver webServer no playwright.config.ts), recriado a cada execução.

test("home mostra status da API e do banco", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Projeto pronto" })).toBeVisible();
  await expect(page.getByText("API: ok")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Banco: ok")).toBeVisible();
});

test("mobile 390px sem scroll horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("main")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
});

test("API fora do ar: home mostra alerta de erro", async ({ page }) => {
  await page.route("**/api/**", (r) => r.abort());
  await page.goto("/");
  await expect(page.getByText("Falha ao conectar")).toBeVisible();
});

test("sem erros no console no fluxo normal", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByText("API: ok")).toBeVisible({ timeout: 15_000 });
  expect(errors).toEqual([]);
});
