"use client";

import Link from "next/link";
import { Alert } from "@/design-system/components/alert";
import { Card } from "@/design-system/components/card";
import { MetricCard } from "@/design-system/components/metric-card";
import { StatusBadge } from "@/design-system/components/status-badge";
import {
  getBenchmark,
  getCaughtExample,
  getQuestions,
  getSchemaStats,
  getValidationCases,
} from "@/lib/traductor/demo";

const BENCH = getBenchmark();
const STATS = getSchemaStats();
const QUESTIONS = getQuestions();
const CASES = getValidationCases();
const CAUGHT = getCaughtExample();

function pct(v: number) {
  return `${(v * 100).toFixed(0)}%`;
}

export default function AppPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
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
                <p className="text-xs text-muted-foreground">Text-to-SQL con guardrails</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge tone="info" dot className="px-3 py-1">
              Demo mode
            </StatusBadge>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        {/* ── SUMMARY BAR ─────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard
            label="SQL válido (guardado)"
            value={pct(BENCH.guarded.rate)}
            hint={`${BENCH.guarded.valid}/${BENCH.guarded.total} exact-match`}
            tone="success"
          />
          <MetricCard
            label="Naive sin guardrail"
            value={pct(BENCH.naive.rate)}
            hint={`${BENCH.naive.valid}/${BENCH.naive.total} válidos`}
            tone="warning"
          />
          <MetricCard
            label="Alucinaciones cazadas"
            value={`${BENCH.hallucinationsCaught}/${BENCH.hallucinationsTotal}`}
            hint="recall del detector"
            tone="success"
          />
          <MetricCard
            label="Falsos positivos"
            value={BENCH.falsePositives}
            hint="SQL válido marcado"
            tone="info"
          />
        </div>

        {/* ── WORKED EXAMPLE ──────────────────── */}
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Alucinación cazada antes de ejecutar</h2>
          <p className="text-sm text-muted-foreground mb-5">
            El modelo naive emitió <code className="font-mono text-xs">SUM(total)</code> sobre
            <code className="font-mono text-xs"> orders</code>, pero la columna real es
            <code className="font-mono text-xs"> amount</code>. El guardrail lo rechaza con su
            violación exacta, y nunca llega a la base de datos.
          </p>
          <Card className="p-5">
            <p className="text-sm font-semibold text-foreground mb-3">{CAUGHT.question}</p>
            <div className="rounded-[var(--radius-md)] bg-muted/40 px-4 py-3 font-mono text-sm">
              {CAUGHT.sql}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge tone="danger">rechazado</StatusBadge>
              {CAUGHT.violations.map((v) => (
                <span key={v} className="rounded-full border border-danger/25 bg-danger/10 px-2.5 py-0.5 font-mono text-xs text-danger">
                  {v}
                </span>
              ))}
            </div>
          </Card>
        </section>

        {/* ── BENCHMARK TABLE ─────────────────── */}
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Guardado vs naive</h2>
          <p className="text-sm text-muted-foreground mb-5">
            El generador guardado llena plantillas parametrizadas y siempre produce SQL válido. El
            naive emite SQL crudo y alucina en 3 de {QUESTIONS.length} preguntas (columna, tabla y
            un DML) — todos cazados por el guardrail.
          </p>
          <div className="overflow-x-auto rounded-[var(--radius-md)] shadow-[var(--shadow-card)] bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--gray-50)]">
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pregunta</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">SQL naive</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Veredicto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {QUESTIONS.map((q) => (
                  <tr key={q.id}>
                    <td className="px-5 py-3.5 align-top">
                      <p className="font-semibold text-foreground">{q.text}</p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">{q.generated}</p>
                    </td>
                    <td className="px-4 py-3.5 align-top font-mono text-xs text-muted-foreground">
                      {q.naiveSql}
                    </td>
                    <td className="px-4 py-3.5 align-top text-right">
                      {q.naiveOk ? (
                        <StatusBadge tone="success">ok</StatusBadge>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <StatusBadge tone="danger">rechazado</StatusBadge>
                          {q.naiveViolations.map((v) => (
                            <span key={v} className="font-mono text-[10px] text-danger">{v}</span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── HALLUCINATION DETECTOR ──────────── */}
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Detector de alucinaciones</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Batería adversarial sobre el schema ({STATS.tables} tablas, {STATS.columns} columnas):
            tablas y columnas inexistentes, y DDL/DML. Cada caso con su veredicto esperado, pinado
            por fixtures compartidos entre TS y Python.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {CASES.map((c) => (
              <Card key={c.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-muted-foreground">{c.id}</span>
                  {c.ok ? (
                    <StatusBadge tone="success">válido</StatusBadge>
                  ) : (
                    <StatusBadge tone="danger">rechazado</StatusBadge>
                  )}
                </div>
                <p className="font-mono text-sm text-foreground mb-2">{c.sql}</p>
                {c.violations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {c.violations.map((v) => (
                      <span key={v} className="rounded-full border border-danger/25 bg-danger/10 px-2 py-0.5 font-mono text-[10px] text-danger">
                        {v}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* ── ARCHITECTURE NOTE ───────────────── */}
        <section>
          <Alert tone="info" title="Plantillas parametrizadas + validación">
            El generador guardado nunca emite SQL crudo: llena una plantilla pre-validada, así que
            una tabla o columna inexistente es estructuralmente imposible. El detector de
            alucinaciones es la red de seguridad que corre antes de ejecutar cualquier SQL — ya sea
            del generador o de un modelo externo. El extractor de referencias es determinista
            (proxy documentado de un parser/planner SQL real).
          </Alert>
        </section>

        <footer className="pt-8 border-t border-[var(--border)] flex items-center justify-between text-xs text-muted-foreground">
          <span>Traductor · Text-to-SQL con guardrails · Demo mode</span>
          <a href="https://github.com/mdeasis27/traductor" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors font-mono">GitHub</a>
        </footer>
      </div>
    </div>
  );
}
