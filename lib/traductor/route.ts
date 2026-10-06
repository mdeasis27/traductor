// lib/traductor/route.ts
// Deterministic free-text → template router (bilingual EN/ES). Stands in for
// the LLM's job of choosing a template and supplying params; the SQL is then
// emitted by the pre-validated templates in generate.ts.

import type { Question } from "./types";

const COUNTRY_MAP: Record<string, string> = {
  mexico: "Mexico", méxico: "Mexico",
  brazil: "Brazil", brasil: "Brazil",
  argentina: "Argentina",
  colombia: "Colombia",
  chile: "Chile",
  peru: "Peru", perú: "Peru",
};

function detectTable(text: string): string | null {
  const t = text.toLowerCase();
  if (/\bcustomers?\b|\bclientes?\b/.test(t)) return "customers";
  if (/\borders?\b|\bpedidos?\b/.test(t)) return "orders";
  if (/\bpayments?\b|\bpagos?\b/.test(t)) return "payments";
  return null;
}

function detectCountry(text: string): string | null {
  const t = text.toLowerCase();
  for (const [key, value] of Object.entries(COUNTRY_MAP)) {
    if (t.includes(key)) return value;
  }
  return null;
}

function detectNumber(text: string): number | null {
  const m = text.match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

// Write verbs are refused before table matching; the templates only read.
const WRITE_VERBS = /\b(drop|delete|insert|update|truncate|alter|elimina\w*|borra\w*|actualiza\w*|inserta\w*)\b/;

export function routeQuestion(text: string): Question | null {
  const lower = text.toLowerCase();
  if (WRITE_VERBS.test(lower)) return null;
  const table = detectTable(lower);
  if (!table) return null;

  const base: Question = { id: "routed", text, template: "", params: {}, sql: "", naiveSql: "" };

  // count
  if (/how many|count|cu[aá]ntos|cu[aá]ntas|contar/.test(lower)) {
    return { ...base, template: "count_all", params: { table } };
  }
  // total / sum
  if (/total|suma?\b/.test(lower)) {
    const col = table === "customers" ? null : "amount";
    if (!col) return { ...base, template: "list_all", params: { table } };
    if (/por m[eé]todo|by method/.test(lower)) return { ...base, template: "group_sum", params: { table, aggregate: "amount", column: "method" } };
    if (/por estado|by status|by state/.test(lower)) return { ...base, template: "group_sum", params: { table, aggregate: "amount", column: "status" } };
    return { ...base, template: "aggregate_sum", params: { table, column: "amount" } };
  }
  // average
  if (/average|avg|promedio/.test(lower)) {
    return { ...base, template: "aggregate_avg", params: { table, column: "amount" } };
  }

  // grouping
  if (/por estado|by status|by state/.test(lower) && table === "orders") {
    return { ...base, template: "group_count", params: { table, column: "status" } };
  }
  if (/por m[eé]todo|by method/.test(lower)) {
    return { ...base, template: "group_sum", params: { table, aggregate: "amount", column: "method" } };
  }
  if (/por pa[ií]s|by country/.test(lower)) {
    return { ...base, template: "group_count", params: { table, column: "country" } };
  }
  if (/por nivel|por tier|by tier/.test(lower)) {
    return { ...base, template: "group_count", params: { table, column: "tier" } };
  }

  // filters
  const country = detectCountry(lower);
  if (country && table === "customers") {
    return { ...base, template: "filter_eq", params: { table, column: "country", value: country } };
  }
  if (/premium|est[aá]ndar|standard/.test(lower) && table === "customers") {
    const tier = /premium/.test(lower) ? "premium" : "standard";
    return { ...base, template: "filter_eq", params: { table, column: "tier", value: tier } };
  }
  if (/pending|paid|shipped|cancelled|pagado|enviado|cancelado|pendiente/.test(lower) && table === "orders") {
    const status = /pending|pendiente/.test(lower) ? "pending"
      : /paid|pagado/.test(lower) ? "paid"
      : /shipped|enviado/.test(lower) ? "shipped"
      : "cancelled";
    return { ...base, template: "filter_eq", params: { table, column: "status", value: status } };
  }
  if (/card|transfer|cash|tarjeta|transferencia|efectivo/.test(lower) && table === "payments") {
    const method = /card|tarjeta/.test(lower) ? "card"
      : /transfer|transferencia/.test(lower) ? "transfer"
      : "cash";
    return { ...base, template: "filter_eq", params: { table, column: "method", value: method } };
  }
  const num = detectNumber(lower);
  if (num !== null && table !== "customers" && /greater|more than|above|>|mayor|m[aá]s de|superior/.test(lower)) {
    return { ...base, template: "filter_gt", params: { table, column: "amount", value: num } };
  }

  // default
  return { ...base, template: "list_all", params: { table } };
}
