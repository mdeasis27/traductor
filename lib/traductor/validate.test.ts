import { describe, expect, it } from "vitest";

import schemaRaw from "./data/schema.json";
import { validateSql, violationLabel } from "./validate";
import type { Schema } from "./types";

const SCHEMA = schemaRaw as unknown as Schema;

describe("validateSql — SELECT-only guard", () => {
  it("flags DDL/DML statements", () => {
    expect(validateSql("DELETE FROM orders WHERE id = 1", SCHEMA).violations).toEqual([
      { kind: "dml", keyword: "DELETE" },
    ]);
    expect(validateSql("DROP TABLE customers", SCHEMA).violations).toEqual([
      { kind: "dml", keyword: "DROP" },
    ]);
    expect(validateSql("UPDATE orders SET status = 'pending' WHERE customer_id = 1", SCHEMA).violations).toEqual([
      { kind: "dml", keyword: "UPDATE" },
    ]);
  });
});

describe("validateSql — hallucinated table references", () => {
  it("flags unknown tables", () => {
    expect(validateSql("SELECT * FROM users", SCHEMA).violations).toEqual([
      { kind: "table", table: "users" },
    ]);
  });

  it("skips column checks when the only table is unknown", () => {
    const v = validateSql("SELECT name FROM users ORDER BY orders DESC", SCHEMA);
    expect(v.violations).toEqual([{ kind: "table", table: "users" }]);
  });
});

describe("validateSql — hallucinated column references", () => {
  it("flags unknown bare columns", () => {
    expect(validateSql("SELECT email FROM customers", SCHEMA).violations).toEqual([
      { kind: "column", table: "customers", column: "email" },
    ]);
  });

  it("flags unknown dotted columns via alias", () => {
    expect(validateSql("SELECT o.total FROM orders o", SCHEMA).violations).toEqual([
      { kind: "column", table: "orders", column: "total" },
    ]);
  });

  it("flags unknown columns inside aggregates", () => {
    expect(validateSql("SELECT SUM(total) FROM orders", SCHEMA).violations).toEqual([
      { kind: "column", table: "orders", column: "total" },
    ]);
  });
});

describe("validateSql — valid SQL passes clean", () => {
  it.each([
    "SELECT * FROM customers",
    "SELECT name, country FROM customers",
    "SELECT * FROM customers WHERE country = 'Mexico'",
    "SELECT status, COUNT(*) FROM orders GROUP BY status",
    "SELECT c.name, COUNT(o.id) AS n FROM customers c JOIN orders o ON o.customer_id = c.id GROUP BY c.name ORDER BY n DESC LIMIT 1",
  ])("accepts %s", (sql) => {
    const v = validateSql(sql, SCHEMA);
    expect(v.ok).toBe(true);
    expect(v.violations).toEqual([]);
  });
});

describe("violationLabel", () => {
  it("formats each kind", () => {
    expect(violationLabel({ kind: "table", table: "users" })).toBe("table:users");
    expect(violationLabel({ kind: "column", table: "orders", column: "total" })).toBe("column:orders.total");
    expect(violationLabel({ kind: "dml", keyword: "DELETE" })).toBe("dml:DELETE");
  });
});
