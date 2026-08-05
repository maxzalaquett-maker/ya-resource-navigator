#!/usr/bin/env python3
"""Rebuild the app's JSON/CSV data from the FARM127 workbook using only Python stdlib.

Usage:
  python3 scripts/import_xlsx.py
  python3 scripts/import_xlsx.py path/to/workbook.xlsx
"""

from __future__ import annotations

import csv
import json
import re
import sys
import zipfile
from datetime import datetime, timedelta
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_XLSX = ROOT / "source" / "FARM127_Charlotte_Young_Adult_Resource_Directory.xlsx"
OUTPUT_JSON = ROOT / "data" / "app-data.json"
OUTPUT_CSV = ROOT / "data" / "resources.csv"

NS_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS_PACKAGE_REL = "http://schemas.openxmlformats.org/package/2006/relationships"

RESOURCE_KEYS = {
    "ID": "id",
    "Primary category": "category",
    "Resource / program": "name",
    "Foster-care specific?": "fosterSpecific",
    "Priority": "priority",
    "Best for / referral trigger": "referralTrigger",
    "Age / eligibility": "eligibility",
    "What it provides": "provides",
    "How to access": "access",
    "Phone": "phone",
    "Location / service area": "location",
    "Capacity / verification caveat": "caveat",
    "Official source URL": "sourceUrl",
    "Last verified": "lastVerified",
    "FARM127 referral status": "referralStatus",
    "FARM127 notes": "notes",
    "Area": "area",
    "Area group": "areaGroup",
    "Support focus tags": "focusTags",
    "Radius / service-area note": "radiusNote",
}


def qn(namespace: str, tag: str) -> str:
    return f"{{{namespace}}}{tag}"


def col_index(cell_ref: str) -> int:
    letters = re.match(r"[A-Z]+", cell_ref.upper())
    if not letters:
        return 0
    value = 0
    for char in letters.group(0):
        value = value * 26 + (ord(char) - 64)
    return value - 1


def excel_date(value: object) -> str:
    if value in (None, ""):
        return ""
    try:
        serial = float(value)
    except (TypeError, ValueError):
        return str(value)
    return (datetime(1899, 12, 30) + timedelta(days=serial)).date().isoformat()


class XlsxReader:
    def __init__(self, path: Path):
        self.path = path
        self.zip = zipfile.ZipFile(path)
        self.shared_strings = self._load_shared_strings()
        self.sheets = self._load_sheet_targets()

    def _load_shared_strings(self) -> list[str]:
        try:
            root = ET.fromstring(self.zip.read("xl/sharedStrings.xml"))
        except KeyError:
            return []
        strings: list[str] = []
        for item in root.findall(qn(NS_MAIN, "si")):
            parts = [node.text or "" for node in item.iter(qn(NS_MAIN, "t"))]
            strings.append("".join(parts))
        return strings

    def _load_sheet_targets(self) -> dict[str, str]:
        workbook = ET.fromstring(self.zip.read("xl/workbook.xml"))
        rels = ET.fromstring(self.zip.read("xl/_rels/workbook.xml.rels"))
        rel_map = {
            rel.attrib["Id"]: rel.attrib["Target"]
            for rel in rels.findall(qn(NS_PACKAGE_REL, "Relationship"))
        }
        targets: dict[str, str] = {}
        sheets = workbook.find(qn(NS_MAIN, "sheets"))
        if sheets is None:
            return targets
        for sheet in sheets.findall(qn(NS_MAIN, "sheet")):
            name = sheet.attrib["name"]
            rel_id = sheet.attrib[qn(NS_REL, "id")]
            target = rel_map[rel_id].lstrip("/")
            if not target.startswith("xl/"):
                target = f"xl/{target}"
            targets[name] = target
        return targets

    def read_sheet(self, sheet_name: str) -> list[list[object]]:
        target = self.sheets[sheet_name]
        root = ET.fromstring(self.zip.read(target))
        rows: list[list[object]] = []
        for row_node in root.iter(qn(NS_MAIN, "row")):
            values: dict[int, object] = {}
            for cell in row_node.findall(qn(NS_MAIN, "c")):
                ref = cell.attrib.get("r", "A1")
                cell_type = cell.attrib.get("t", "n")
                value_node = cell.find(qn(NS_MAIN, "v"))
                inline = cell.find(qn(NS_MAIN, "is"))
                raw = value_node.text if value_node is not None else None

                if cell_type == "s" and raw is not None:
                    value: object = self.shared_strings[int(raw)]
                elif cell_type == "inlineStr" and inline is not None:
                    value = "".join((node.text or "") for node in inline.iter(qn(NS_MAIN, "t")))
                elif cell_type == "b":
                    value = raw == "1"
                elif cell_type in {"str", "e"}:
                    value = raw or ""
                elif raw is None:
                    value = ""
                else:
                    try:
                        number = float(raw)
                        value = int(number) if number.is_integer() else number
                    except ValueError:
                        value = raw
                values[col_index(ref)] = value

            if values:
                max_col = max(values)
                row = [""] * (max_col + 1)
                for index, value in values.items():
                    row[index] = value
                rows.append(row)
        return rows


def find_header(rows: list[list[object]], first_cell: str) -> tuple[int, list[object]]:
    for index, row in enumerate(rows):
        if row and str(row[0]).strip() == first_cell:
            return index, row
    raise ValueError(f"Could not find header row beginning with {first_cell!r}")


def rows_after_header(rows: list[list[object]], first_cell: str, width: int) -> list[list[object]]:
    index, _ = find_header(rows, first_cell)
    output: list[list[object]] = []
    blank_run = 0
    for row in rows[index + 1 :]:
        padded = (row + [""] * width)[:width]
        if not str(padded[0]).strip():
            blank_run += 1
            if blank_run >= 2:
                break
            continue
        blank_run = 0
        output.append(padded)
    return output


def clean(value: object) -> object:
    return "" if value is None else value


def main() -> None:
    xlsx_path = Path(sys.argv[1]).expanduser().resolve() if len(sys.argv) > 1 else DEFAULT_XLSX
    if not xlsx_path.exists():
        raise SystemExit(f"Workbook not found: {xlsx_path}")

    reader = XlsxReader(xlsx_path)

    resource_sheet = reader.read_sheet("Resource Directory")
    header_index, resource_headers = find_header(resource_sheet, "ID")
    resource_rows = rows_after_header(resource_sheet, "ID", len(resource_headers))
    resources: list[dict[str, object]] = []
    for row in resource_rows:
        record: dict[str, object] = {}
        for header, value in zip(resource_headers, row):
            key = RESOURCE_KEYS.get(str(header))
            if not key:
                continue
            record[key] = excel_date(value) if key == "lastVerified" else clean(value)
        if record.get("id"):
            resources.append(record)

    foster_rows = rows_after_header(reader.read_sheet("Foster Programs"), "Program", 6)
    foster_keys = ["program", "ageWindow", "eligibilityTrigger", "primaryValue", "farm127Action", "sourceUrl"]
    foster_programs = [{key: clean(value) for key, value in zip(foster_keys, row)} for row in foster_rows]

    needs_rows = rows_after_header(reader.read_sheet("Needs Map"), "Support-plan domain", 4)
    needs_keys = ["domain", "primaryOptions", "backupOptions", "strategy"]
    needs_map = [{key: clean(value) for key, value in zip(needs_keys, row)} for row in needs_rows]

    partner_rows = rows_after_header(reader.read_sheet("Partnership Priorities"), "Organization", 8)
    partner_keys = ["organization", "whyStrategic", "suggestedFirstAsk", "referralPathway", "priority", "status", "owner", "notes"]
    partnerships = [{key: clean(value) for key, value in zip(partner_keys, row)} for row in partner_rows]

    triage_rows = rows_after_header(reader.read_sheet("Start Here"), "Situation", 5)
    triage_keys = ["situation", "firstAction", "phone", "backup", "limit"]
    triage = [{key: clean(value) for key, value in zip(triage_keys, row)} for row in triage_rows[:8]]

    verified_dates = [str(item.get("lastVerified", "")) for item in resources if item.get("lastVerified")]
    verified_date = max(verified_dates) if verified_dates else datetime.now().date().isoformat()

    payload = {
        "meta": {
            "title": "FARM127 Charlotte-Area Young Adult Resource Navigator",
            "verifiedDate": verified_date,
            "resourceCount": len(resources),
            "description": "A researched working directory of reputable resources in Charlotte, surrounding communities within roughly 30 miles, and essential statewide or national fallback programs.",
            "radiusDefinition": "Local results are grouped by service location within roughly 30 road miles of Uptown Charlotte. This is a practical service-area screen, not a precise geospatial guarantee.",
        },
        "resources": resources,
        "triage": triage,
        "fosterPrograms": foster_programs,
        "needsMap": needs_map,
        "partnerships": partnerships,
    }

    OUTPUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    with OUTPUT_CSV.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(RESOURCE_KEYS.values()))
        writer.writeheader()
        writer.writerows(resources)

    print(f"Imported {len(resources)} resources from {xlsx_path.name}")
    print(f"Wrote {OUTPUT_JSON.relative_to(ROOT)}")
    print(f"Wrote {OUTPUT_CSV.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
