import { expect, test, type Page } from "@playwright/test";

// Os testes usam o banco real (.env do back): cada task criada leva TAG e é apagada no afterAll.
const TAG = `[e2e ${Date.now()}]`;
const a = `${TAG} Primeira`;
const b = `${TAG} Segunda`;

// Toasts do sonner também são <li>: linhas de task só dentro do <main>.
const row = (page: Page, title: string) => page.getByRole("main").getByRole("listitem").filter({ hasText: title });
const input = (page: Page) => page.getByLabel("Nova task");
const addButton = (page: Page) => page.getByRole("button", { name: "Adicionar", exact: true });

test.afterAll(async ({ request }) => {
  const tasks: { id: number; title: string }[] = await (await request.get("/api/tasks")).json();
  for (const t of tasks.filter((t) => t.title.startsWith(TAG))) {
    await request.delete(`/api/tasks/${t.id}`);
  }
});

test("home mostra status da API e do banco", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Projeto pronto" })).toBeVisible();
  await expect(page.getByText("API: ok")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Banco: ok")).toBeVisible();
  await expect(page.getByRole("link", { name: "Início" })).toHaveAttribute("aria-current", "page");

  await page.getByRole("link", { name: "Ir para Tasks" }).click();
  await expect(page).toHaveURL("/tasks");
  await expect(page.getByText(/de \d+ concluídas/)).toBeVisible();
});

test.describe.serial("tasks", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto("/tasks");
    await expect(page.getByText(/de \d+ concluídas/)).toBeVisible();
  });

  test.afterAll(() => page.close());

  test("adicionar fica desabilitado com input vazio ou só espaços", async () => {
    await expect(addButton(page)).toBeDisabled();
    await input(page).fill("   ");
    await expect(addButton(page)).toBeDisabled();
    await input(page).fill("");
  });

  test("adiciona duas tasks seguidas via Enter mantendo o foco", async () => {
    await input(page).fill(a);
    await input(page).press("Enter");
    await expect(row(page, a)).toBeVisible();
    await expect(input(page)).toHaveValue("");
    await expect(input(page)).toBeFocused();

    await page.keyboard.type(b);
    await page.keyboard.press("Enter");
    await expect(row(page, b)).toBeVisible();
  });

  test("marcar risca o texto e atualiza o contador", async () => {
    const [, done, total] = (await page.getByText(/de \d+ concluídas/).textContent())!.match(/(\d+) de (\d+)/)!;
    await row(page, a).getByRole("checkbox").click();
    await expect(row(page, a).getByRole("checkbox")).toBeChecked();
    await expect(row(page, a).getByText(a)).toHaveClass(/line-through/);
    await expect(page.getByText(`${Number(done) + 1} de ${total} concluídas`)).toBeVisible();
  });

  test("filtros Pendentes / Concluídas / Todas", async () => {
    await page.getByRole("radio", { name: "Pendentes" }).click();
    await expect(row(page, b)).toBeVisible();
    await expect(row(page, a)).toHaveCount(0);

    await page.getByRole("radio", { name: "Concluídas" }).click();
    await expect(row(page, a)).toBeVisible();
    await expect(row(page, b)).toHaveCount(0);

    await page.getByRole("radio", { name: "Todas" }).click();
    await expect(row(page, a)).toBeVisible();
    await expect(row(page, b)).toBeVisible();
  });

  test("estado persiste após recarregar", async () => {
    await page.reload();
    await expect(row(page, a).getByRole("checkbox")).toBeChecked();
    await expect(row(page, b).getByRole("checkbox")).not.toBeChecked();
  });

  test("excluir remove a task e mostra toast", async () => {
    await page.getByRole("button", { name: `Excluir "${b}"` }).click();
    await expect(row(page, b)).toHaveCount(0);
    await expect(page.getByText(`"${b}" excluída.`)).toBeVisible();

    await page.getByRole("button", { name: `Excluir "${a}"` }).click();
    await expect(row(page, a)).toHaveCount(0);
  });
});

test("mobile 390px sem scroll horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  for (const path of ["/", "/tasks"]) {
    await page.goto(path);
    await expect(page.getByRole("main")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  }
});

test.describe("API fora do ar", () => {
  test.beforeEach(({ page }) => page.route("**/api/**", (r) => r.abort()));

  test("home mostra alerta de erro", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Falha ao conectar")).toBeVisible();
  });

  test("tasks mostra um toast de erro e estado vazio", async ({ page }) => {
    await page.goto("/tasks");
    await expect(page.getByText("Não foi possível carregar as tasks.")).toBeVisible();
    await expect(page.getByText("Nenhuma task aqui")).toBeVisible();
  });
});

test("sem erros no console no fluxo normal", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByText("API: ok")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("navigation").getByRole("link", { name: "Tasks" }).click();
  await expect(page.getByText(/de \d+ concluídas/)).toBeVisible();
  expect(errors).toEqual([]);
});
