// scripts/seed.mjs
// Creates the traductor schema + tables and seeds realistic data.
// Run: node scripts/seed.mjs  (requires DATABASE_URL in env or .env.local)

import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

function loadEnv() {
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.trim().match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch {
    /* no .env.local */
  }
}

loadEnv();

const sql = neon(process.env.DATABASE_URL);

const CUSTOMERS = [
  ["María Fernández", "Mexico", "premium"],
  ["Carlos López", "Mexico", "standard"],
  ["Ana Souza", "Brazil", "premium"],
  ["Juan Pérez", "Argentina", "standard"],
  ["Lucía Gómez", "Colombia", "standard"],
  ["Pedro Silva", "Brazil", "standard"],
  ["Sofía Torres", "Mexico", "premium"],
  ["Diego Morales", "Chile", "standard"],
  ["Valentina Ríos", "Argentina", "premium"],
  ["Andrés Castro", "Peru", "standard"],
  ["Camila Vega", "Mexico", "standard"],
  ["Mateo Luna", "Brazil", "premium"],
];

const ORDERS = [
  [1, 1250.0, "paid"], [2, 340.5, "pending"], [3, 890.0, "shipped"],
  [4, 76.0, "cancelled"], [5, 2100.0, "paid"], [6, 450.0, "pending"],
  [7, 980.0, "paid"], [8, 150.0, "shipped"], [9, 3200.0, "paid"],
  [10, 95.0, "pending"], [11, 640.0, "shipped"], [12, 1800.0, "paid"],
  [1, 430.0, "pending"], [3, 720.0, "shipped"], [5, 115.0, "cancelled"],
  [7, 540.0, "paid"], [9, 260.0, "pending"], [11, 1350.0, "paid"],
  [2, 88.0, "shipped"], [6, 1990.0, "paid"],
];

const PAYMENTS = [
  [1, 1250.0, "card"], [3, 890.0, "transfer"], [5, 2100.0, "card"],
  [7, 980.0, "card"], [9, 3200.0, "transfer"], [12, 1800.0, "card"],
  [14, 720.0, "cash"], [16, 540.0, "card"], [18, 1350.0, "transfer"],
  [20, 1990.0, "card"], [4, 76.0, "cash"], [8, 150.0, "card"],
  [11, 640.0, "transfer"], [13, 430.0, "cash"], [17, 260.0, "card"],
];

async function main() {
  await sql`CREATE SCHEMA IF NOT EXISTS traductor`;
  await sql`DROP TABLE IF EXISTS traductor.queries`;
  await sql`DROP TABLE IF EXISTS traductor.payments`;
  await sql`DROP TABLE IF EXISTS traductor.orders`;
  await sql`DROP TABLE IF EXISTS traductor.customers`;

  await sql`
    CREATE TABLE traductor.customers (
      id serial PRIMARY KEY,
      name text NOT NULL,
      country text NOT NULL,
      tier text NOT NULL
    )`;
  await sql`
    CREATE TABLE traductor.orders (
      id serial PRIMARY KEY,
      customer_id integer NOT NULL REFERENCES traductor.customers(id),
      amount numeric NOT NULL,
      status text NOT NULL
    )`;
  await sql`
    CREATE TABLE traductor.payments (
      id serial PRIMARY KEY,
      order_id integer NOT NULL REFERENCES traductor.orders(id),
      amount numeric NOT NULL,
      method text NOT NULL
    )`;
  await sql`
    CREATE TABLE traductor.queries (
      id serial PRIMARY KEY,
      question text NOT NULL,
      sql text NOT NULL,
      row_count integer NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;

  for (const [name, country, tier] of CUSTOMERS) {
    await sql`INSERT INTO traductor.customers (name, country, tier) VALUES (${name}, ${country}, ${tier})`;
  }
  for (const [customerId, amount, status] of ORDERS) {
    await sql`INSERT INTO traductor.orders (customer_id, amount, status) VALUES (${customerId}, ${amount}, ${status})`;
  }
  for (const [orderId, amount, method] of PAYMENTS) {
    await sql`INSERT INTO traductor.payments (order_id, amount, method) VALUES (${orderId}, ${amount}, ${method})`;
  }

  const [{ c }] = await sql`SELECT count(*)::int AS c FROM traductor.customers`;
  const [{ o }] = await sql`SELECT count(*)::int AS o FROM traductor.orders`;
  const [{ p }] = await sql`SELECT count(*)::int AS p FROM traductor.payments`;
  console.log(`Seeded traductor schema: ${c} customers, ${o} orders, ${p} payments`);
}

main().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});
