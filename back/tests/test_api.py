import os
from pathlib import Path

# Banco novo a cada execução: senão um teste de campo único (2º POST = 409) falha na 2ª rodada.
Path("test.db").unlink(missing_ok=True)
os.environ["DATABASE_URL"] = "sqlite:///./test.db"

from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import app


def test_health():
    with TestClient(app) as client:  # "with" roda o lifespan (cria as tabelas)
        assert client.get("/api/health").json() == {"status": "ok", "database": "ok"}


def test_supabase_url_uses_psycopg():
    url = Settings(DATABASE_URL="postgres://u:p@h:5432/db").DATABASE_URL
    assert url == "postgresql+psycopg://u:p@h:5432/db"
