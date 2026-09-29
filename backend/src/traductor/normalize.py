"""SQL normalization — mirrors lib/traductor/normalize.ts."""

from __future__ import annotations

import re


def normalize_sql(sql: str) -> str:
    s = re.sub(r";\s*$", "", sql.strip())
    s = s.lower()
    s = re.sub(r"\s+", " ", s)
    return s


def exact_match(a: str, b: str) -> bool:
    return normalize_sql(a) == normalize_sql(b)
