"""Hallucination detector + SELECT-only guardrail — mirrors lib/traductor/validate.ts."""

from __future__ import annotations

import re

from .normalize import normalize_sql
from .schema import column_names, has_column, has_table, table_names

DML_DDL = {
    "insert", "update", "delete", "drop", "alter", "create", "truncate",
    "merge", "grant", "revoke", "replace",
}

KEYWORDS = {
    "select", "from", "where", "group", "by", "order", "limit", "offset",
    "join", "inner", "left", "right", "full", "outer", "cross", "on", "as",
    "and", "or", "not", "in", "between", "like", "ilike", "is", "null",
    "asc", "desc", "distinct", "all", "having", "union", "intersect",
    "except", "count", "sum", "avg", "min", "max", "case", "when", "then",
    "else", "end", "cast", "coalesce", "round", "abs", "lower", "upper",
    "length", "trim",
}

TABLE_REF = re.compile(r"\b(?:from|join)\s+([a-z_][a-z0-9_]*)(?:\s+(?:as\s+)?([a-z_][a-z0-9_]*))?")
DOTTED = re.compile(r"\b([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*)")
WORD = re.compile(r"[a-z_][a-z0-9_]*")
AS_ALIAS = re.compile(r"\bas\s+([a-z_][a-z0-9_]*)")


def violation_label(v: dict) -> str:
    if v["kind"] == "table":
        return f"table:{v['table']}"
    if v["kind"] == "column":
        return f"column:{v['table']}.{v['column']}"
    return f"dml:{v['keyword']}"


def validate_sql(sql: str, schema: dict) -> dict:
    norm = normalize_sql(sql)

    lead = norm.split(" ")[0]
    if lead in DML_DDL:
        return {"ok": False, "violations": [{"kind": "dml", "keyword": lead.upper()}]}

    violations: list[dict] = []

    tables: list[str] = []
    aliases: dict[str, str] = {}
    for m in TABLE_REF.finditer(norm):
        table = m.group(1)
        alias = m.group(2)
        tables.append(table)
        if alias:
            aliases[alias] = table

    existing_tables = [t for t in tables if has_table(schema, t)]
    for t in tables:
        if not has_table(schema, t):
            violations.append({"kind": "table", "table": t})

    for m in DOTTED.finditer(norm):
        prefix = m.group(1)
        column = m.group(2)
        resolved = aliases.get(prefix) or (prefix if has_table(schema, prefix) else None)
        if resolved and has_table(schema, resolved) and not has_column(schema, resolved, column):
            violations.append({"kind": "column", "table": resolved, "column": column})

    if existing_tables:
        valid_columns = set()
        for t in existing_tables:
            valid_columns.update(column_names(schema, t))

        bare = re.sub(r"'[^']*'", " ", norm)
        bare = DOTTED.sub(" ", bare)
        defined_aliases: set[str] = set()

        def _as(m: re.Match) -> str:
            defined_aliases.add(m.group(1))
            return " "

        bare = AS_ALIAS.sub(_as, bare)

        stop = (
            set(KEYWORDS)
            | set(tables)
            | set(aliases.keys())
            | set(defined_aliases)
            | set(table_names(schema))
        )
        attr_table = existing_tables[0]
        for tok in WORD.findall(bare):
            if tok in stop:
                continue
            if tok not in valid_columns:
                violations.append({"kind": "column", "table": attr_table, "column": tok})

    return {"ok": len(violations) == 0, "violations": violations}
