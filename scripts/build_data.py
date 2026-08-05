#!/usr/bin/env python3
"""Rebuild app-data.json from resources.csv and support-data.json."""

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"

with (DATA / "resources.csv").open(newline="", encoding="utf-8") as handle:
    resources = list(csv.DictReader(handle))
    for resource in resources:
        try:
            resource["id"] = int(resource["id"])
        except (ValueError, TypeError):
            pass

support = json.loads((DATA / "support-data.json").read_text(encoding="utf-8"))
support["resources"] = resources
support.setdefault("meta", {})["resourceCount"] = len(resources)
(DATA / "app-data.json").write_text(json.dumps(support, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Wrote data/app-data.json with {len(resources)} resources")
