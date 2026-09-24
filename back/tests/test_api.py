import os

os.environ["DATABASE_URL"] = "sqlite:///./test.db"

from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import app


def test_health_and_tasks():
    with TestClient(app) as client:  # "with" roda o lifespan (cria as tabelas)
        assert client.get("/api/health").json() == {"status": "ok", "database": "ok"}
        created = client.post("/api/tasks", json={"title": "teste"})
        assert created.status_code == 201
        assert created.json()["title"] == "teste"
        assert any(t["title"] == "teste" for t in client.get("/api/tasks").json())
        assert client.post("/api/tasks", json={"title": ""}).status_code == 422


def test_supabase_url_uses_psycopg():
    url = Settings(DATABASE_URL="postgres://u:p@h:5432/db").DATABASE_URL
    assert url == "postgresql+psycopg://u:p@h:5432/db"
