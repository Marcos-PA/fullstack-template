---
name: novo-recurso
description: Cria um recurso CRUD completo (model, schema, service, rota e teste no back; tipo, service e página shadcn no front) seguindo as convenções do projeto. Use quando pedirem "novo recurso", "novo CRUD", "nova entidade", "cadastro de X" ou /novo-recurso.
argument-hint: <nome> <campo:tipo> [campo:tipo...]  ex: produto nome:str preco:float categoria:enum(alimento|limpeza) ativo:bool
---

# Novo recurso CRUD

Pedido: `$ARGUMENTS`

O recurso **Task** é o exemplo de referência. Antes de escrever, leia os arquivos equivalentes
de Task e copie a estrutura, trocando nomes e campos. Não invente padrões novos.

Nomes: `<recurso>` no singular em snake_case (`produto`), classe em PascalCase (`Produto`),
tabela e URL no plural (`produtos`, `/produtos`). Textos da UI em português.

Faltou nome ou campos? Pergunte uma vez, com um exemplo do formato. Não chute campos.

## Tipos de campo

| Pedido      | SQLAlchemy (`Mapped[...]`)                         | Pydantic                  | TypeScript | Controle shadcn                    |
| ----------- | -------------------------------------------------- | ------------------------- | ---------- | ---------------------------------- |
| `str`       | `str` + `String(200)`                              | `str = Field(min_length=1, max_length=200)` | `string` | `Input`                  |
| `text`      | `str` + `Text`                                     | `str`                     | `string`   | `Textarea`                         |
| `int`       | `int`                                              | `int`                     | `number`   | `Input type="number"`              |
| `float`     | `float`                                            | `float`                   | `number`   | `Input type="number" step="0.01"`  |
| `bool`      | `bool` + `Boolean, default=False`                  | `bool = False`            | `boolean`  | `Checkbox` (form) / `Switch`       |
| `date`      | `date` + `Date`                                    | `date`                    | `string` (`YYYY-MM-DD`) | `Popover` + `Calendar` |
| `enum(a\|b)` | `str` + `String(20)`                               | `Literal["a", "b"]`       | `"a" \| "b"` | `Select` (ou `ToggleGroup` se ≤ 5) |
| `fk:<alvo>` | `int` + `ForeignKey("<alvos>.id")`                 | `int`                     | `number`   | `Select` com os itens do alvo      |

- `enum` sem valores (`categoria:enum`)? Pergunte os valores. Defina `Literal` uma vez no schema
  (`Categoria = Literal[...]`) e reuse em Create/Update/Response; no front, um `Record<Categoria, string>`
  com os rótulos alimenta o `Select` e a tabela.
- Dinheiro: use `float`. `Decimal` vira **string** no JSON do Pydantic v2 e complica o front.
- `fk`: o SQLite do dev não aplica a FK. No service, antes de criar/atualizar, busque o alvo com
  `db.get(...)` e levante `HTTPException(404, "<Alvo> não encontrado")` se não existir.
- `date`: o JSON usa `"YYYY-MM-DD"`. No front **nunca** `new Date("2026-12-31")` (é UTC e mostra o
  dia anterior no Brasil): use `parseISO(s)` para ler e `format(d, "yyyy-MM-dd")` para enviar
  (`date-fns`, já instalado). Exibir: `format(parseISO(s), "dd/MM/yyyy")`. Calendar:
  `<Calendar mode="single" locale={ptBR} selected=... onSelect=... />` com
  `import { ptBR } from "react-day-picker/locale"`.
- Campo opcional: `Mapped[X | None]` com `nullable=True`, Pydantic `X | None = None`, TS `x: X | null`.

## Back (`back/`)

1. `app/models/<recurso>.py`: classe herdando `Base` (como `models/task.py`).
   **Importe em `app/models/__init__.py`**, senão a tabela não é criada.
2. `app/schemas/<recurso>.py`: `<R>Create`, `<R>Update` (todos os campos opcionais, com
   `default=None`) e `<R>Response` com `model_config = {"from_attributes": True}`.
3. `app/services/<recursos>.py`: `create_` (com vários campos: `Model(**data.model_dump())`),
   `list_`, `get_` (404 com `detail` em português), `update_` (`model_dump(exclude_unset=True)`) e `delete_`, como `services/tasks.py`.
4. `app/api/routes/<recurso>.py`: `APIRouter(prefix="/<recursos>", tags=["<recursos>"])` com
   GET lista, POST (201), PATCH `/{id}` e DELETE `/{id}` (204). Rotas finas: só chamam o service.
   Precisa de GET `/{id}`? Só se alguma tela usar.
5. Registrar em `app/api/router.py`.
6. `tests/test_api.py`: um teste `test_<recurso>_crud` cobrindo criar (201), listar, 422 de
   validação, atualizar, excluir (204) e 404 depois de excluir.

Mudou colunas de um model **já criado** no Supabase? `create_all` não altera tabelas: avise o
usuário para apagar a tabela no Table Editor e reiniciar o back.

## Front (`front/src/`)

7. `types/<recurso>.ts`: interface espelhando `<R>Response`.
8. `services/<recurso>Service.ts`: `list`, `create`, `update`, `delete` usando `api`, caminhos
   relativos (`/<recursos>`), como `services/taskService.ts`.
9. `pages/<Recursos>.tsx` com componentes de `@/components/ui` (regras em `.agents/skills/shadcn/SKILL.md`):
   - Lista: `Table` se tiver 3+ campos; lista simples como em `Tasks.tsx` se tiver 1–2.
   - Criar/editar: formulário em `Dialog` com `FieldGroup` + `Field` + `FieldLabel`.
     Formulário de 1 campo pode ficar inline com `InputGroup`, como em Tasks.
   - Excluir: `AlertDialog` de confirmação.
   - Estados: `Skeleton` carregando, `Empty` sem itens, `toast.error(getErrorMessage(err, "..."))`
     nos erros (`getErrorMessage` vem de `@/services/api`) e `Spinner` + `disabled` enquanto salva.
   - Um estado `form` com o objeto inteiro (`ProdutoInput = Omit<Produto, "id">`) e um `vazio`
     para "Novo"; o mesmo `Dialog` serve para criar e editar. Número: `e.target.valueAsNumber || 0`.
   - Moeda: `new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`.
   - `fk`: carregue a lista do alvo e mostre o nome dele, não o id.
10. Registrar a rota em `App.tsx` e adicionar o link no array `links` de `layouts/MainLayout.tsx`.

Precisa de um componente que ainda não existe em `components/ui`? `npx shadcn@latest add <nome>`.

## Verificar antes de concluir

```bash
cd back && uv run ruff check --fix . && uv run pytest   # --fix ordena o import novo em models/__init__.py
cd front && npm run build
npm run test:e2e   # na raiz: roda o E2E numa stack isolada com SQLite
```

Se o recurso tiver fluxo principal na UI, adicione um teste em `tests/app.spec.ts` no estilo dos
de Task (criar, editar, excluir) e rode `npx playwright test --project=chromium`. Dicas de seletor:
formulário em `page.getByRole("dialog")`; opções do `Select` e dias do `Calendar` abrem num portal,
então busque na página (`page.getByRole("option", ...)`, `page.getByRole("gridcell", ...)`);
confirmação de exclusão em `page.getByRole("alertdialog")`; linhas de tabela com
`page.getByRole("row").filter({ hasText })`.

O aviso do Vite "chunks larger than 500 kB" depois de usar `Calendar` (date-fns) é esperado e
não quebra o deploy.
