"""How much of the catalog the librarian knows. Mirrors lib/traductor/shelves.ts."""

import re

from .generate import generate
from .normalize import exact_match, normalize_sql
from .validate import validate_sql

SHELF_ORDER = ["customers", "orders", "payments"]


def trim_schema(schema: dict, k: int) -> dict:
    keep = SHELF_ORDER[:k]
    return {"tables": {t: v for t, v in schema["tables"].items() if t in keep}}


def shelf_outcomes(questions: list[dict], schema: dict, k: int | None = None) -> list[str]:
    """served: valid SQL with the gold answer; rerouted: template or guard refused; lost: valid SQL, wrong answer."""
    if k is None:
        k = len(SHELF_ORDER)
    if not isinstance(k, int) or k < 0 or k > len(SHELF_ORDER):
        raise ValueError("k must be 0 to 3 tables.")
    known = trim_schema(schema, k)
    out: list[str] = []
    for q in questions:
        try:
            sql = generate(q, known)
        except ValueError:
            out.append("rerouted")
            continue
        if not validate_sql(sql, known)["ok"]:
            out.append("rerouted")
        else:
            out.append("served" if exact_match(sql, q["sql"]) else "lost")
    return out


def question_tables(sql: str) -> list[str]:
    """The shelves a query reads (FROM / JOIN targets), each once, in the order the query visits them."""
    seen: list[str] = []
    for table in re.findall(r"\b(?:from|join)\s+([a-z_][a-z0-9_]*)", normalize_sql(sql)):
        if table not in seen:
            seen.append(table)
    return seen
