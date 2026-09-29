"""Benchmark — mirrors lib/traductor/benchmark.ts."""

from __future__ import annotations

from .generate import generate
from .normalize import exact_match
from .validate import validate_sql


def _rate(valid: int, total: int) -> float:
    return 0.0 if total == 0 else valid / total


def benchmark(questions: list[dict], schema: dict) -> dict:
    guarded_valid = 0
    naive_valid = 0
    hallucinations_caught = 0
    hallucinations_total = 0
    false_positives = 0

    for q in questions:
        generated = generate(q, schema)
        guarded_verdict = validate_sql(generated, schema)
        if guarded_verdict["ok"] and exact_match(generated, q["sql"]):
            guarded_valid += 1

        naive_exact = exact_match(q["naiveSql"], q["sql"])
        naive_verdict = validate_sql(q["naiveSql"], schema)
        if naive_exact and naive_verdict["ok"]:
            naive_valid += 1

        if not naive_exact:
            hallucinations_total += 1
            if not naive_verdict["ok"]:
                hallucinations_caught += 1
        elif not naive_verdict["ok"]:
            false_positives += 1

    n = len(questions)
    return {
        "guarded": {"valid": guarded_valid, "total": n, "rate": _rate(guarded_valid, n)},
        "naive": {"valid": naive_valid, "total": n, "rate": _rate(naive_valid, n)},
        "hallucinationsCaught": hallucinations_caught,
        "hallucinationsTotal": hallucinations_total,
        "falsePositives": false_positives,
        "n": n,
    }
