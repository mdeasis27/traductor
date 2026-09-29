"""Schema lookups — mirrors lib/traductor/schema.ts."""

from __future__ import annotations


def table_names(schema: dict) -> list[str]:
    return list(schema["tables"].keys())


def column_names(schema: dict, table: str) -> list[str]:
    t = schema["tables"].get(table)
    return list(t["columns"].keys()) if t else []


def has_table(schema: dict, table: str) -> bool:
    return table in schema["tables"]


def has_column(schema: dict, table: str, column: str) -> bool:
    t = schema["tables"].get(table)
    return bool(t) and column in t["columns"]
