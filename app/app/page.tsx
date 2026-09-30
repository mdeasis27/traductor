"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert } from "@/design-system/components/alert";
import { MetricCard } from "@/design-system/components/metric-card";
import { StatusBadge } from "@/design-system/components/status-badge";

interface QueryResult {
  question?: string;
  sql?: string;
  ok?: boolean;
  rowCount?: number;
  rows?: Record<string, unknown>[];
  truncated?: boolean;
  violations?: string[];
  error?: string;
}

interface HistoryItem {
  id: number;
  question: string;
  sql: string;
  row_count: number;
  created_at: string;
}

const EXAMPLES = [
  "Lista todos los clientes",
  "¿Cuántos clientes hay?",
  "Clientes de México",
  "Pedidos con monto mayor a 1000",
  "Monto total de pedidos",
  "Pedidos por estado",
  "Pagos por método",
  "Promedio de monto de pagos",
];

export default function AppPage() {
  const [question, setQuestion] = useState("Clientes de México");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  async function run(q: string) {
    setQuestion(q);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      setResult(data);
      if (res.ok && data.ok) loadHistory();
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : "Error de red" });
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.queries ?? []);
      }
    } catch {
      /* history is best-effort */
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const columns = result?.rows && result.rows.length > 0 ? Object.keys(result.rows[0]) : [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
              Inicio
            </Link>
            <div className="h-4 w-px bg-[var(--border)]" aria-hidden="true" />
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <svg className="h-4 w-4 text-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-semibold text-foreground leading-tight">Traductor</h1>
                <p className="text-xs text-muted-foreground">Text-to-SQL con base de datos real</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge tone="success" dot className="px-3 py-1">Postgres en vivo</StatusBadge>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div className="max-w-3xl">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Consulta la base de datos en lenguaje natural</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Escribe una pregunta y el sistema genera SQL, lo valida contra el schema (guardrails) y
            lo <strong>ejecuta de verdad</strong> contra una base Postgres con datos reales. Cada
            consulta queda guardada en el historial.
          </p>
        </div>

        {/* ── EXAMPLES ────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => run(ex)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                question === ex ? "border-info/40 bg-info/10 text-info" : "border-[var(--border)] text-muted-foreground hover:text-foreground"
              }`}
            >
              {ex}
            </button>
          ))}
        </div>

        {/* ── INPUT ───────────────────────────── */}
        <div className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run(question)}
            placeholder="P.ej. Clientes de México"
            className="flex-1 rounded-[var(--radius-md)] border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
          />
          <button
            onClick={() => run(question)}
            disabled={loading}
            className="rounded-[var(--radius-md)] bg-accent px-5 py-2 text-sm font-medium text-[#ffffff] hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Consultando…" : "Ejecutar SQL"}
          </button>
        </div>

        {/* ── RESULT ──────────────────────────── */}
        {result && (
          <div className="space-y-4">
            {result.error && !result.sql && <Alert tone="danger" title="No se pudo resolver">{result.error}</Alert>}

            {result.sql && (
              <div className="rounded-[var(--radius-md)] shadow-[var(--shadow-card)] bg-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge tone={result.ok ? "success" : "danger"} dot>
                    {result.ok ? "SQL válido" : "Rechazado"}
                  </StatusBadge>
                  {result.violations && result.violations.map((v) => (
                    <span key={v} className="rounded-full border border-danger/25 bg-danger/10 px-2 py-0.5 font-mono text-xs text-danger">{v}</span>
                  ))}
                </div>
                <code className="block font-mono text-sm text-foreground bg-muted/40 rounded-[var(--radius-md)] px-4 py-3 overflow-x-auto">
                  {result.sql}
                </code>
              </div>
            )}

            {result.ok && result.rows && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <MetricCard label="Filas devueltas" value={result.rowCount ?? result.rows.length} hint={result.truncated ? "mostrando 50" : "resultado completo"} tone="success" />
                </div>
                <div className="overflow-x-auto rounded-[var(--radius-md)] shadow-[var(--shadow-card)] bg-card">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--gray-50)]">
                        {columns.map((c) => (
                          <th key={c} scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {result.rows.map((row, i) => (
                        <tr key={i}>
                          {columns.map((c) => (
                            <td key={c} className="px-4 py-2.5 text-foreground tabular-nums">{String(row[c] ?? "")}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── HISTORY ─────────────────────────── */}
        {history.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3">Historial de consultas (persistido en Postgres)</h3>
            <div className="overflow-x-auto rounded-[var(--radius-md)] shadow-[var(--shadow-card)] bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--gray-50)]">
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pregunta</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">SQL</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Filas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {history.map((h) => (
                    <tr key={h.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setQuestion(h.question)}>
                      <td className="px-4 py-2.5 text-foreground">{h.question}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{h.sql}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-foreground">{h.row_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
