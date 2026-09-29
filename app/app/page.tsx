"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert } from "@/design-system/components/alert";
import { Card } from "@/design-system/components/card";
import { MetricCard } from "@/design-system/components/metric-card";
import { StatusBadge } from "@/design-system/components/status-badge";
import { generate } from "@/lib/traductor/generate";
import { validateSql, violationLabel } from "@/lib/traductor/validate";
import { getBenchmark, getSchemaStats } from "@/lib/traductor/demo";
import type { Question, Schema, Verdict } from "@/lib/traductor/types";
import schemaRaw from "@/lib/traductor/data/schema.json";

const BENCH = getBenchmark();
const STATS = getSchemaStats();
const SCHEMA = schemaRaw as unknown as Schema;

const pct = (v: number) => `${(v * 100).toFixed(0)}%`;

type TemplateKey =
  | "list_all"
  | "count_all"
  | "filter_eq"
  | "filter_gt"
  | "aggregate_sum"
  | "group_count"
  | "top_join_count"
  | "group_sum"
  | "filter_join"
  | "aggregate_avg";

const TEMPLATES: {
  id: TemplateKey;
  label: string;
  table: boolean;
  column: boolean;
  value: boolean;
  aggregate: boolean;
  limit: boolean;
}[] = [
  { id: "list_all", label: "Listar todo", table: true, column: false, value: false, aggregate: false, limit: false },
  { id: "count_all", label: "Contar registros", table: true, column: false, value: false, aggregate: false, limit: false },
  { id: "filter_eq", label: "Filtrar por igualdad", table: true, column: true, value: true, aggregate: false, limit: false },
  { id: "filter_gt", label: "Filtrar por mayor que", table: true, column: true, value: true, aggregate: false, limit: false },
  { id: "aggregate_sum", label: "Suma agregada", table: true, column: true, value: false, aggregate: false, limit: false },
  { id: "group_count", label: "Conteo agrupado", table: true, column: true, value: false, aggregate: false, limit: false },
  { id: "top_join_count", label: "Cliente con más pedidos", table: false, column: false, value: false, aggregate: false, limit: true },
  { id: "group_sum", label: "Suma agrupada", table: true, column: true, value: false, aggregate: true, limit: false },
  { id: "filter_join", label: "Filtro con join", table: false, column: false, value: false, aggregate: false, limit: false },
  { id: "aggregate_avg", label: "Promedio agregado", table: true, column: true, value: false, aggregate: false, limit: false },
];

const INPUT_CLASS =
  "rounded-[var(--radius-md)] border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/60";

type GenResult =
  | { kind: "ok"; sql: string; verdict: Verdict }
  | { kind: "error"; message: string };

type ValResult = { sql: string; verdict: Verdict };

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function AppPage() {
  const [template, setTemplate] = useState<TemplateKey>("list_all");
  const [table, setTable] = useState("customers");
  const [column, setColumn] = useState("name");
  const [value, setValue] = useState("Mexico");
  const [aggregate, setAggregate] = useState("amount");
  const [limit, setLimit] = useState("1");
  const [gen, setGen] = useState<GenResult | null>(null);

  const [rawSql, setRawSql] = useState("SELECT email FROM customers");
  const [val, setVal] = useState<ValResult | null>(null);

  const cfg = TEMPLATES.find((t) => t.id === template)!;

  function runGenerate() {
    const params: Record<string, string | number> = {};
    if (cfg.table) params.table = table;
    if (cfg.column) params.column = column;
    if (cfg.value) params.value = template === "filter_gt" ? Number(value) : value;
    if (cfg.aggregate) params.aggregate = aggregate;
    if (cfg.limit) params.limit = Number(limit);

    const question: Question = {
      id: "custom",
      text: "Consulta en vivo",
      template,
      params,
      sql: "",
      naiveSql: "",
    };

    try {
      const sql = generate(question, SCHEMA);
      const verdict = validateSql(sql, SCHEMA);
      setGen({ kind: "ok", sql, verdict });
    } catch (err) {
      setGen({ kind: "error", message: err instanceof Error ? err.message : String(err) });
    }
  }

  function runValidate() {
    const verdict = validateSql(rawSql, SCHEMA);
    setVal({ sql: rawSql, verdict });
  }

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

        {/* ── GENERATOR PLAYGROUND ────────────── */}
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Generador de SQL en vivo</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Elige una plantilla y sus parámetros. El generador guardado llena la plantilla
            pre-validada y produce SQL siempre válido — una tabla o columna inexistente es
            estructuralmente imposible. Schema: {STATS.tables} tablas, {STATS.columns} columnas.
          </p>

          <Card className="p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Plantilla">
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value as TemplateKey)}
                  className={INPUT_CLASS}
                >
                  {TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>
              {cfg.table && (
                <Field label="Tabla">
                  <input
                    type="text"
                    value={table}
                    onChange={(e) => setTable(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </Field>
              )}
              {cfg.column && (
                <Field label="Columna">
                  <input
                    type="text"
                    value={column}
                    onChange={(e) => setColumn(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </Field>
              )}
              {cfg.value && (
                <Field label={template === "filter_gt" ? "Valor (número)" : "Valor (string)"}>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </Field>
              )}
              {cfg.aggregate && (
                <Field label="Columna a agregar">
                  <input
                    type="text"
                    value={aggregate}
                    onChange={(e) => setAggregate(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </Field>
              )}
              {cfg.limit && (
                <Field label="Límite">
                  <input
                    type="text"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </Field>
              )}
            </div>
            <button
              onClick={runGenerate}
              className="mt-4 w-full rounded-[var(--radius-md)] bg-accent px-4 py-2.5 text-sm font-medium text-[#ffffff] hover:bg-accent/90 transition-colors"
            >
              Generar SQL
            </button>
          </Card>

          {gen && (
            <Card className="mt-4 p-5">
              {gen.kind === "ok" ? (
                <>
                  <div className="rounded-[var(--radius-md)] bg-muted/40 px-4 py-3 font-mono text-sm">
                    {gen.sql}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {gen.verdict.ok ? (
                      <StatusBadge tone="success" dot>válido</StatusBadge>
                    ) : (
                      <>
                        <StatusBadge tone="danger" dot>rechazado</StatusBadge>
                        {gen.verdict.violations.map((v) => (
                          <span
                            key={violationLabel(v)}
                            className="rounded-full border border-danger/25 bg-danger/10 px-2.5 py-0.5 font-mono text-xs text-danger"
                          >
                            {violationLabel(v)}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                </>
              ) : (
                <Alert tone="danger" title="No se pudo generar">
                  {gen.message}
                </Alert>
              )}
            </Card>
          )}
        </section>

        {/* ── HALLUCINATION DETECTOR ──────────── */}
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Detector de alucinaciones en vivo</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Pega SQL crudo (de un modelo externo, por ejemplo) y valida cada referencia contra el
            schema. El guardrail rechaza tablas y columnas inexistentes y cualquier DDL/DML.
          </p>

          <Card className="p-5">
            <textarea
              value={rawSql}
              onChange={(e) => setRawSql(e.target.value)}
              rows={4}
              className={`${INPUT_CLASS} w-full font-mono`}
            />
            <button
              onClick={runValidate}
              className="mt-4 w-full rounded-[var(--radius-md)] bg-accent px-4 py-2.5 text-sm font-medium text-[#ffffff] hover:bg-accent/90 transition-colors"
            >
              Validar SQL
            </button>
          </Card>

          {val && (
            <Card className="mt-4 p-5">
              <div className="flex items-center gap-3">
                {val.verdict.ok ? (
                  <StatusBadge tone="success" dot>válido</StatusBadge>
                ) : (
                  <StatusBadge tone="danger" dot>rechazado</StatusBadge>
                )}
                <span className="text-sm text-muted-foreground">
                  {val.verdict.ok
                    ? "Sin violaciones: listo para ejecutar."
                    : `${val.verdict.violations.length} violación${val.verdict.violations.length === 1 ? "" : "es"}.`}
                </span>
              </div>
              {val.verdict.violations.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {val.verdict.violations.map((v) => (
                    <span
                      key={violationLabel(v)}
                      className="rounded-full border border-danger/25 bg-danger/10 px-2.5 py-0.5 font-mono text-xs text-danger"
                    >
                      {violationLabel(v)}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          )}
        </section>

        {/* ── ARCHITECTURE NOTE ───────────────── */}
        <section>
          <Alert tone="info" title="Plantillas parametrizadas + validación">
            El generador guardado nunca emite SQL crudo: llena una plantilla pre-validada, así que
            una tabla o columna inexistente es estructuralmente imposible. El detector de
            alucinaciones es la red de seguridad que corre antes de ejecutar cualquier SQL — ya sea
            del generador o de un modelo externo.
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
