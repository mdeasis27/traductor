import json
from pathlib import Path

import pytest

from traductor.benchmark import benchmark
from traductor.generate import generate
from traductor.normalize import exact_match
from traductor.validate import validate_sql, violation_label

FIXTURES = Path(__file__).parent / "fixtures"


def _load(name: str):
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


def _schema():
    return _load("schema.json")


def _questions():
    return _load("questions.json")["questions"]


def test_validation_cases_match_fixture():
    schema = _schema()
    for case in _load("validation.json")["cases"]:
        verdict = validate_sql(case["sql"], schema)
        labels = [violation_label(v) for v in verdict["violations"]]
        assert labels == case["expected"]
        assert verdict["ok"] == (len(case["expected"]) == 0)


def test_generate_reproduces_gold_sql():
    schema = _schema()
    for q in _questions():
        assert exact_match(generate(q, schema), q["sql"])


def test_generate_output_always_passes_guardrail():
    schema = _schema()
    for q in _questions():
        assert validate_sql(generate(q, schema), schema)["ok"]


def test_generate_rejects_unknown_table():
    q = {"id": "x", "text": "", "template": "list_all", "params": {"table": "users"}, "sql": "", "naiveSql": ""}
    with pytest.raises(ValueError, match="unknown table: users"):
        generate(q, _schema())


def test_benchmark_matches_fixture():
    schema = _schema()
    fixture = _load("benchmark.json")

    result = benchmark(_questions(), schema)
    assert result["n"] == fixture["n"]
    assert result["guarded"]["valid"] == fixture["guarded"]["valid"]
    assert result["naive"]["valid"] == fixture["naive"]["valid"]
    assert result["guarded"]["rate"] == pytest.approx(fixture["guarded"]["rate"], abs=1e-9)
    assert result["naive"]["rate"] == pytest.approx(fixture["naive"]["rate"], abs=1e-9)
    assert result["hallucinationsCaught"] == fixture["hallucinationsCaught"]
    assert result["hallucinationsTotal"] == fixture["hallucinationsTotal"]
    assert result["falsePositives"] == fixture["falsePositives"]


def test_shelf_outcomes_match_fixture():
    from traductor.shelves import shelf_outcomes

    coverage = _load("coverage.json")
    for k, expected in coverage["outcomes"].items():
        assert shelf_outcomes(_questions(), _schema(), int(k)) == expected
    assert shelf_outcomes(_questions(), _schema(), None) == coverage["outcomes"]["3"]
