// lib/traductor/route.ts
// Deterministic free-text → template router. Stands in for the LLM's job of
// choosing a template and supplying params; the SQL is then emitted by the
// pre-validated templates in generate.ts. Handles the demo's question patterns.

import type { Question } from "./types";

const COUNTRY_VALUES = ["mexico", "brazil", "argentina", "usa", "united states", "colombia", "chile", "peru"];
const TIERS = ["premium", "standard"];
const STATUS = ["pending", "paid", "shipped", "cancelled"];
const METHODS = ["card", "transfer", "cash"];

function detectTable(text: string): string | null {
  if (/\bcustomers?\b/.test(text)) return "customers";
  if (/\borders?\b/.test(text)) return "orders";
  if (/\bpayments?\b/.test(text)) return "payments";
  return null;
}

function detectValue(text: string, values: string[]): string | null {
  const lower = text.toLowerCase();
  for (const v of values) {
    if (lower.includes(v)) return v;
  }
  return null;
}

function detectNumber(text: string): number | null {
  const m = text.match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

export function routeQuestion(text: string): Question | null {
  const lower = text.toLowerCase();
  const table = detectTable(lower);
  if (!table) return null;

  const base: Question = { id: "routed", text, template: "", params: {}, sql: "", naiveSql: "" };

  // aggregations
  if (/how many|count/.test(lower)) {
    return { ...base, template: "count_all", params: { table } };
  }
  if (/total|sum/.test(lower)) {
    const col = table === "customers" ? null : "amount";
    if (col) {
      if (/by method/.test(lower)) return { ...base, template: "group_sum", params: { table, aggregate: "amount", column: "method" } };
      if (/by status/.test(lower)) return { ...base, template: "group_sum", params: { table, aggregate: "amount", column: "status" } };
      return { ...base, template: "aggregate_sum", params: { table, column: "amount" } };
    }
  }
  if (/average|avg/.test(lower)) {
    return { ...base, template: "aggregate_avg", params: { table, column: "amount" } };
  }

  // grouping
  if (/by (status|state)/.test(lower) && table === "orders") {
    return { ...base, template: "group_count", params: { table, column: "status" } };
  }
  if (/by method/.test(lower)) {
    return { ...base, template: "group_sum", params: { table, aggregate: "amount", column: "method" } };
  }
  if (/by (country|tier)/.test(lower)) {
    const col = /tier/.test(lower) ? "tier" : "country";
    return { ...base, template: "group_count", params: { table, column: col } };
  }

  // filters
  const country = detectValue(lower, COUNTRY_VALUES);
  if (country && table === "customers") {
    const cap = country[0].toUpperCase() + country.slice(1);
    return { ...base, template: "filter_eq", params: { table, column: "country", value: cap } };
  }
  const tier = detectValue(lower, TIERS);
  if (tier && table === "customers") {
    return { ...base, template: "filter_eq", params: { table, column: "tier", value: tier } };
  }
  const status = detectValue(lower, STATUS);
  if (status && table === "orders") {
    return { ...base, template: "filter_eq", params: { table, column: "status", value: status } };
  }
  const method = detectValue(lower, METHODS);
  if (method && table === "payments") {
    return { ...base, template: "filter_eq", params: { table, column: "method", value: method } };
  }
  const num = detectNumber(lower);
  if (num !== null && table !== "customers" && /greater|more than|above|>|mayor|más de|superior/.test(lower)) {
    return { ...base, template: "filter_gt", params: { table, column: "amount", value: num } };
  }

  // default
  return { ...base, template: "list_all", params: { table } };
}
