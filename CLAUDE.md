# Convenções do projeto

Stack: React + Vite + TS + Tailwind (front/) · FastAPI + SQLAlchemy 2 (back/) · Postgres no Supabase.
Deploy: front na Vercel, back no Render (render.yaml). Cada `git push` na main faz deploy.

## Prioridade (projeto de 2h)
- Funcionalidade que o enunciado pede > código bonito. Sem auth, testes extras ou libs novas se não forem pedidos.
- Faça commit e push a cada feature funcionando, para testar na URL pública cedo.

## Back (back/, FastAPI + uv)
- Dependências: sempre `uv add <pacote>` (dev: `uv add --dev`). Nunca pip. Commitar o `uv.lock`.
- Nova rota: `app/api/routes/<recurso>.py` com um `APIRouter`, registrado em `app/api/router.py`.
  Todas as rotas ficam sob o prefixo `/api`.
- Banco na rota: parâmetro `db: DbSession` (de `app.db.session`).
- Model SQLAlchemy: `app/models/<recurso>.py`, herdando `Base`; importar em `app/models/__init__.py`
  (senão a tabela não é criada).
- Tabelas são criadas no startup (`create_all`). Ele NÃO altera tabela existente: mudou colunas de um
  model já criado → apagar a tabela no Supabase (Table Editor) e reiniciar o back.
- Schemas Pydantic (entrada/saída): `app/schemas/<recurso>.py`. Nunca retornar model direto.
- Regra de negócio: `app/services/<recurso>.py`. Rotas ficam finas.
- Config/segredos: `app/core/config.py` + `.env`. Nada hardcoded. Nova variável → adicionar também
  no painel do Render.
- Antes de concluir: `uv run ruff check . && uv run pytest`.

## Front (front/, React + Vite + TS + Tailwind)
- Estilo só com classes Tailwind. Sem arquivos .css novos.
- Chamadas HTTP só via `src/services/` usando a instância `api` de `services/api.ts`.
  Caminhos relativos (`/tasks`), nunca URL completa.
- Tipos das respostas da API em `src/types/`, espelhando os schemas do back.
- Páginas em `src/pages/` (registradas em `App.tsx`), componentes reutilizáveis em `src/components/`,
  hooks em `src/hooks/`, layouts em `src/layouts/`.
- Antes de concluir: `npm run build` (a Vercel falha no deploy se o build falhar).
