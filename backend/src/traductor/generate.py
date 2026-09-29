"""Guarded generator — mirrors lib/traductor/generate.ts."""

from __future__ import annotations

from .schema import has_column, has_table


def _format_value(value) -> str:
    return str(value) if isinstance(value, (int, float)) else f"'{value}'"


def _require_table(schema: dict, table: str) -> None:
    if not has_table(schema, table):
        raise ValueError(f"unknown table: {table}")


def _require_column(schema: dict, table: str, column: str) -> None:
    _require_table(schema, table)
    if not has_column(schema, table, column):
        raise ValueError(f"unknown column: {table}.{column}")


def generate(question: dict, schema: dict) -> str:
    p = question["params"]
    table = p.get("table", "")
    column = p.get("column", "")
    aggregate = p.get("aggregate", "")
    template = question["template"]

    if template == "list_all":
        _require_table(schema, table)
        return f"SELECT * FROM {table}"
    if template == "count_all":
        _require_table(schema, table)
        return f"SELECT COUNT(*) FROM {table}"
    if template == "filter_eq":
        _require_column(schema, table, column)
        return f"SELECT * FROM {table} WHERE {column} = {_format_value(p['value'])}"
    if template == "filter_gt":
        _require_column(schema, table, column)
        return f"SELECT * FROM {table} WHERE {column} > {_format_value(p['value'])}"
    if template == "aggregate_sum":
        _require_column(schema, table, column)
        return f"SELECT SUM({column}) FROM {table}"
    if template == "group_count":
        _require_column(schema, table, column)
        return f"SELECT {column}, COUNT(*) FROM {table} GROUP BY {column}"
    if template == "top_join_count":
        _require_table(schema, "customers")
        _require_table(schema, "orders")
        _require_column(schema, "orders", "customer_id")
        return (
            "SELECT c.name, COUNT(o.id) AS n FROM customers c JOIN orders o "
            "ON o.customer_id = c.id GROUP BY c.name ORDER BY n DESC LIMIT "
            f"{_format_value(p['limit'])}"
        )
    if template == "group_sum":
        _require_column(schema, table, column)
        _require_column(schema, table, aggregate)
        return f"SELECT {column}, SUM({aggregate}) FROM {table} GROUP BY {column}"
    if template == "filter_join":
        _require_table(schema, "customers")
        _require_table(schema, "orders")
        return (
            "SELECT o.id FROM orders o JOIN customers c ON o.customer_id = c.id "
            "WHERE c.tier = 'premium' AND o.status = 'pending'"
        )
    if template == "aggregate_avg":
        _require_column(schema, table, column)
        return f"SELECT AVG({column}) FROM {table}"

    raise ValueError(f"unknown template: {template}")
