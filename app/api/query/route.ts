import { NextResponse } from "next/server";
import { getSql, qualify } from "@/lib/db/client";
import { routeQuestion } from "@/lib/traductor/route";
import { generate } from "@/lib/traductor/generate";
import { validateSql, violationLabel } from "@/lib/traductor/validate";
import schemaRaw from "@/lib/traductor/data/schema.json";
import type { Schema } from "@/lib/traductor/types";

const SCHEMA = schemaRaw as unknown as Schema;

export async function POST(request: Request) {
  let question: string;
  try {
    const body = await request.json();
    question = typeof body.question === "string" ? body.question.trim() : "";
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 });
  }

  if (!question) {
    return NextResponse.json({ error: "Escribe una pregunta" }, { status: 400 });
  }

  const routed = routeQuestion(question);
  if (!routed) {
    return NextResponse.json({
      error: "No reconocí la tabla (customers / orders / payments). Prueba una pregunta sobre clientes, pedidos o pagos.",
    }, { status: 400 });
  }

  const sql = generate(routed, SCHEMA);
  const verdict = validateSql(sql, SCHEMA);

  if (!verdict.ok) {
    return NextResponse.json({
      question,
      sql,
      ok: false,
      violations: verdict.violations.map(violationLabel),
    });
  }

  try {
    const db = getSql();
    const rows = await db.query(qualify(sql));

    // Persist the query for the dashboard history.
    await db`INSERT INTO traductor.queries (question, sql, row_count) VALUES (${question}, ${sql}, ${rows.length})`;

    return NextResponse.json({
      question,
      sql,
      ok: true,
      rowCount: rows.length,
      rows: rows.slice(0, 50),
      truncated: rows.length > 50,
    });
  } catch (err) {
    return NextResponse.json(
      { question, sql, ok: false, error: err instanceof Error ? err.message : "Error ejecutando SQL" },
      { status: 500 },
    );
  }
}
