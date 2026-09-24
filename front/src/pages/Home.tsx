import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getHealth } from "../services/healthService";
import type { HealthResponse } from "../types/health";

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getHealth().then(setHealth).catch(() => setError(true));
  }, []);

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">Projeto pronto</h1>
      <Link to="/tasks" className="text-emerald-400 underline">Ir para Tasks</Link>
      <div className="rounded-lg border border-slate-800 p-4">
        <p className="text-sm text-slate-400">Conexão com o back-end</p>
        {error && <p className="font-medium text-red-400">Falhou: o back está rodando? (no Render free, a 1ª chamada pode levar ~1 min)</p>}
        {!error && !health && <p className="text-slate-300">Verificando...</p>}
        {health && (
          <p className="font-medium text-emerald-400">
            API: {health.status} · Banco: {health.database}
          </p>
        )}
      </div>
    </section>
  );
}
