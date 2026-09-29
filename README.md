# Traductor

**Text-to-SQL with schema guardrails** — parametrized templates (the model never emits raw
SQL), a deterministic hallucination detector, and a SELECT-only allowlist.

> **Result:** 100% of shipped SQL is valid (exact-match against gold), with **0 false
> positives**. The guardrail catches **3/3 hallucinations** a naive raw-SQL model emits —
> an unknown column (`total`), an unknown table (`users`), and an `UPDATE` — before any of
> them reaches the database. Without the guardrail the naive model is only **70% valid**.

---

## Result

### Guarded vs naive validity (n = 10)

| Path | Valid | Rate |
|---|---|---|
| Guarded generator (templates + validation) | 10 / 10 | **100%** |
| Naive raw-SQL model (no guardrail) | 7 / 10 | 70% |

The 3 hallucinated outputs — one bad column, one bad table, one DML statement — are all
flagged by the guardrail **before execution**: 100% recall, 0 false positives.

### Hallucination detector (8 adversarial cases)

| Case | SQL | Verdict |
|---|---|---|
| h01 | `SELECT * FROM users` | `table:users` |
| h02 | `SELECT email FROM customers` | `column:customers.email` |
| h03 | `DELETE FROM orders WHERE id = 1` | `dml:DELETE` |
| h04 | `SELECT * FROM customers WHERE unknown = 1` | `column:customers.unknown` |
| h05 | `SELECT * FROM customers` | valid |
| h06 | `SELECT name, country FROM customers` | valid |
| h07 | `DROP TABLE customers` | `dml:DROP` |
| h08 | `SELECT o.total FROM orders o` | `column:orders.total` |

---

## Architecture

```
lib/traductor/              # canonical core (TypeScript, tested)
  schema.ts                 #   schema lookups (tables / columns)
  normalize.ts              #   SQL normalization for exact-match
  validate.ts               #   hallucination detector + SELECT-only guardrail
  generate.ts               #   guarded generator (parametrized templates)
  benchmark.ts              #   guarded vs naive validity + recall / FP rate
  demo.ts                   #   wires schema + questions + cases into every number
  data/                     #   schema.json + questions.json (committed)
  fixtures/                 #   benchmark.json + validation.json (pinned, shared)
backend/                    # same math in Python + pytest (authoritative)
  src/traductor/            #   schema.py · normalize.py · validate.py · generate.py · benchmark.py
  tests/                    #   pinned to tests/fixtures/{benchmark,validation}.json
app/                        # Next.js landing + demo dashboard (Vercel, demo mode)
```

Two defenses, two failure modes:

1. **Parametrized templates** — the generator fills a pre-validated template, so a
   hallucinated table/column is *structurally impossible* from this path. The model's job is
   reduced to choosing a template and supplying values.
2. **The guardrail** — a deterministic reference extractor checks every table/column against
   the schema and enforces SELECT-only. It runs on *any* SQL (generated or external) before
   execution, so a raw model's hallucination is caught, not shipped.

## Design decisions & tradeoffs

1. **The model fills params, never emits raw SQL.** Raw SQL is where hallucinations live. A
   template can be validated once against the schema and reused forever; the cost is that new
   query shapes need a new template.
2. **The detector is a deterministic reference extractor, not a real SQL parser.** It is a
   documented proxy (like the lexical retriever was for embeddings). It covers the constrained
   grammar of the demo exactly and reports false positives honestly; production would swap in
   a real planner/`EXPLAIN`.
3. **The naive baseline is a raw model's committed output, not a strawman.** It gets 7/10
   right — enough to show the guardrail's value without pretending the model is useless.

## What did not work

- **Exact-match is brittle as a general metric.** Real SQL has many equivalent forms; here the
  templates make gold and generated identical by construction, so exact-match is honest. A real
  system would compare result sets, not strings.
- **The reference extractor assumes a constrained grammar.** Nested subqueries, `WITH`, and
  column-name ambiguity across a `JOIN` are out of scope for the demo — a real planner resolves
  those, and the demo documents the boundary rather than hiding it.

## Run it

```bash
# frontend demo + TS tests
pnpm install && pnpm dev      # http://localhost:3000
pnpm test                     # 43 vitest tests

# backend (authoritative math) — Python 3.12+
cd backend && uv sync --extra dev && uv run pytest   # 5 tests, pinned fixtures
```

## Stack

Next.js 16 · TypeScript · Vitest · Tailwind v4 · Python 3.13 · pytest
