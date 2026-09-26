# Guide: from interview brief to published project

The flow uses three skills in order: `/brief` plans the project, `/new-project` creates its repo, and `/new-resource` builds each part of it. Everything below assumes the template is at `~/fullstack-template` and new projects go in `~/`.

---

## Before the day (once, plus a 5-minute check the day before)

**One-time setup:**
- `gh` logged in with the `repo` scope. Check with `gh auth status`.
- `uv`, Node, and the Playwright browsers installed. If `npx playwright test` complains about missing browsers, run `npx playwright install`.
- Accounts on **GitHub**, **Supabase**, **Render** and **Vercel**, all logged in in your browser.

**The day before the interview:**
1. **Wake Supabase.** Free projects pause after about a week without use. Open the dashboard and click *Restore* if the project is paused.
2. **Get the template up to date:** `cd ~/fullstack-template && git pull`.
3. **Optional: keep the Supabase connection string handy.** Supabase → *Connect* → **Session pooler** (port 5432). Don't use "Direct connection": it's IPv6-only, and Render can't reach it.

---

## Step 1: Plan the brief (~5–10 min)

```bash
cd ~/fullstack-template && claude
```

Paste the brief. Either form works:
```
/brief <brief text>
```
or just paste it with something like *"tenho 2h pra fazer isso, me ajuda a começar"*. The skill also triggers on its own when you paste a brief.

**You get a plan, and no code yet:**

| Section | What to check |
|---|---|
| **Entendimento** | Did it understand what the system does and who uses it? |
| **Projeto** | The repo name, e.g. `/new-project biblioteca-comunitaria "Biblioteca Comunitária"`. It's public, so pick something you're happy to have in the link. |
| **Recursos** | One `/new-resource` line per entity. Check the fields and the order: a parent comes before anything that points to it. |
| **Regras de negócio** | Each rule says where it lives in the back-end, which HTTP status it returns, and which pytest test covers it. |
| **Fora do template** | Login, upload, charts, and so on. Each comes with a minimal version, its cost in minutes, and whether it's required or an extra. |
| **Suposições** | **The most important part.** For each ambiguity in the brief, the default it will follow. Correct any you disagree with. |
| **Perguntas que bloqueiam** | At most 3, and only when the answer changes the data model. |
| **Passos** | Numbered steps with time estimates, plus the MVP total and a list of extras. |

**Reply with your corrections**, e.g. *"ISBN não é único, pode ter vários exemplares; o resto ok"*. Then confirm with something like *"pode seguir"*.

> Tip: the assumptions are also good interview material. Mentioning them shows how you handled a vague brief.

---

## Step 2: Create the project repo (~5 min, automatic)

Once you confirm, Claude runs **step 0**, `/new-project <nome> "<Título>"`. You can also run it yourself.

What it does, in order:
1. Checks that the name isn't already taken locally or on GitHub. If it is, it stops and asks for another name. It never overwrites anything.
2. Creates `github.com/<your-user>/<nome>` as a **public** repo from the template and clones it to `~/<nome>`.
3. Renames the app: page title, header, Home, README, the Render service name (`<nome>-api`), and the E2E test that checks the title.
4. Installs dependencies and runs ruff, pytest, the build and E2E. All must pass before the first commit and push.
5. Saves the confirmed plan to `~/<nome>/PLAN.md`, which is kept out of git.
6. **Stops** and shows you the repo link, the deploy checklist, and the next command.

> Want it private? Say so before confirming. Keep in mind the reviewer needs to be able to open the link.

---

## Step 3: Switch to a Claude Code session in the new project

**Close the template session** and open one in the project:

```bash
cd ~/<nome> && claude
```

Tell it:
```
follow PLAN.md from step 1
```

This matters: in the template's session, relative commands would hit the template repo, not your project.

---

## Step 4: Connect the deploy (~15 min, done by hand in the browser)

This is **step 1** of the plan. It's the only part you do yourself, and it's worth doing early: without it, the pushes from later steps don't publish anything. The full walkthrough is in the README, under "Deploy".

1. **Supabase:** use a new project, or the existing one if its table names won't clash. Copy the **Session pooler** URL. If the password has special characters (`@ # /`), they must be URL-encoded.
2. **Render:** New → **Blueprint** → pick the repo `<nome>` (it reads `render.yaml` and creates `<nome>-api`).
   - `DATABASE_URL` = the Supabase URL.
   - `CORS_ORIGINS` = `["http://localhost:5173"]` for now.
   - Test it: `https://<nome>-api.onrender.com/api/health` should return `{"status":"ok","database":"ok"}`.
3. **Vercel:** Add New → Project → repo `<nome>` → **Root Directory = `front`**.
   - `VITE_API_URL` = `https://<nome>-api.onrender.com/api`.
4. **Back on Render:** set `CORS_ORIGINS` = `["https://<nome>.vercel.app"]`, with no trailing slash.
5. Open the Vercel URL. The Home page should show **"API: ok · Banco: ok"**.

Tell Claude it's live, and from here **every push deploys automatically**.

---

## Step 5: Build the resources (most of the time)

Claude works through the plan one step per resource, using `/new-resource`. You can also run a line yourself:

```
/new-resource livro titulo:str autor:str ano?:int isbn!:str
/new-resource membro nome:str email!:email
/new-resource emprestimo livro_id:fk:livro membro_id:fk:membro data_prevista:date emprestado_em=:date devolvido_em?=:date no:edit,delete
```

**Each resource produces:**
- **Back-end:** model, schemas, service, route and a pytest test.
- **Front-end:** type, API service, and a page with a table, create/edit dialog, delete confirmation, loading and empty states, and error toasts.
- **Also:** the route and nav link, and the new page added to the phone-width test.

**At the end of each step, Claude:**
- runs `ruff`, `pytest`, `npm run build` and Playwright (Chromium);
- commits and pushes;
- tells you in one line what's done and what's next.

**Open the public URL after each push.** Catching a problem now costs little; catching it 10 minutes before the deadline costs a lot.

### Syntax reference for `/new-resource`

| You write | Meaning |
|---|---|
| `nome:str` · `descricao:text` · `qtd:int` · `preco:float` · `ativo:bool` | basic types (money is `float`) |
| `data:date` · `hora:time` · `criado_em=:datetime` | dates and times (a `datetime` is only ever filled by the back-end) |
| `email:email` | e-mail validated without adding a library |
| `status:enum(aberto\|fechado)` | fixed options (no `:` inside the values: write `09h30`) |
| `livro_id:fk:livro` | foreign key to `livro` (the parent must be created first) |
| `ano?:int` | optional field |
| `isbn!:str` | unique: a duplicate returns 409 |
| `emprestado_em=:date` | filled by the back-end, never shown in the form |
| `devolvido_em?=:date` | empty at first, filled later by an action |
| `no:edit` · `no:delete` · `no:edit,delete` | leaves out edit and/or delete |

**What happens automatically:**
- Deleting a parent that still has children returns 409 instead of crashing on Postgres.
- A missing parent returns 404.
- Today's date uses the Brazil timezone.

**Not generated by `/new-resource`, but the plan covers them:**
- **Actions** such as returning a book or cancelling an order become `POST /<recursos>/{id}/<acao>`, with a button in the table row.
- **Child items** such as an order's line items are created together with their parent, in the same save, and have no page of their own.
- **Login** is built by hand with no new library, right after the deploy step. It also adapts the existing tests so they send a token.

---

## Step 6: Finish the MVP (~15 min)

This is the last step of the plan:
1. **Add one E2E test** of your main flow to `tests/app.spec.ts`.
2. **Run the main flow by hand** on the public URL.
3. **Update the README** with what the project does, the assumptions you made, and the link.
4. Make the final push and **send the Vercel link** to the reviewer.

If there's time left, work through the **Extras** from the plan, in order, with a push after each.

---

## Time budget (2h)

| Part | Time |
|---|---|
| Plan (`/brief`) + corrections | 5–10 min |
| `/new-project` | ~5 min |
| Connect the deploy | ~15 min |
| Simple CRUD / CRUD with a foreign key | 10–15 / 15–20 min |
| Business rule with its test | ~10 min |
| Child items inside a parent | +20–30 min |
| Login | ~40 min |
| Wrap-up (E2E, README) | ~15 min |

The plan targets an **MVP of about 100 min**, which leaves room for surprises. If the required parts alone go past that, the plan doesn't cut requirements. It simplifies them (no editing, only the filters the brief asks for) and tells you the risk.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| The first request on Render takes ~1 min | Render's free tier sleeps after 15 min. Open `/api/health` before presenting. |
| CORS error in the browser console | `CORS_ORIGINS` on Render doesn't exactly match the Vercel URL (check the `https`, and no trailing `/`). |
| Front-end still calls the old URL | Changing `VITE_API_URL` on Vercel requires a **Redeploy**, because it's read at build time. |
| You changed a model's columns and production breaks | `create_all` doesn't alter existing tables. Delete the table in Supabase → Table Editor, then restart the Render service. |
| Deleting a record works locally but gives a 500 in production | Local SQLite doesn't enforce foreign keys; Postgres does. `/new-resource` adds the 409 check, but check any code you wrote by hand. |
| `/new-project` says the name is taken | Choose another name. It never deletes or overwrites anything. |
| E2E fails with "port 8001/5174 in use" | Another E2E run is still going, or those servers were left running. Stop them and run again. |
| Supabase "project paused" | Restore it in the dashboard (free projects pause after about a week idle). |

---

## Commands at a glance

```bash
# Plan (in the template)
cd ~/fullstack-template && claude
/brief <brief text>

# After /new-project, in the project
cd ~/<nome> && claude
follow PLAN.md from step 1
/new-resource <nome> <campo:tipo>...

# Checks (from the project root)
(cd back && uv run ruff check --fix . && uv run pytest)
(cd front && npm run build)
npx playwright test --project=chromium     # quick
npm run test:e2e                           # 3 browsers
```
