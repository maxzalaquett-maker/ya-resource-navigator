#!/usr/bin/env python3
"""Normalize and validate displayed app-data copy before deployment.

This script edits the generated JSON file itself. It never runs in the browser.
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP_DATA = ROOT / "data" / "app-data.json"

RESOURCE_FIELDS = (
    "referralTrigger",
    "eligibility",
    "provides",
    "access",
    "caveat",
    "notes",
    "radiusNote",
)

REPLACEMENTS = (
    (r"\bindependent-living assessment, planning\b", "assessment and planning for living on their own"),
    (r"\bindependent-living support\b", "support for living on their own"),
    (r"\bindependent-living skills\b", "skills for living on their own"),
    (r"\bindependent-living services\b", "services that support living on their own"),
    (r"\bindependent-living assistance\b", "help living on their own"),
    (r"\bindependent-living\b", "independent living"),
    (r"\bcase management\b", "help making a plan and connecting to services"),
    (r"\bcase navigation\b", "help applying for services"),
    (r"\bhousing navigation\b", "help finding housing"),
    (r"\bservice navigation\b", "help finding services"),
    (r"\bcare management\b", "help coordinating care"),
    (r"\bcare coordination\b", "help organizing care"),
    (r"\bbehavioral-health\b", "mental health"),
    (r"\bbehavioral health\b", "mental health"),
    (r"\bmental-health\b", "mental health"),
    (r"\bsubstance-use\b", "substance use"),
    (r"\bpostsecondary\b", "college or career training"),
    (r"\bself-sufficiency\b", "independence"),
    (r"\bvital documents\b", "IDs and important documents"),
    (r"\bprovider connection\b", "connections to care"),
    (r"\bservice coordination\b", "help coordinating services"),
    (r"\bworkforce development\b", "job and career support"),
    (r"\bfinancial capability\b", "money and budgeting support"),
    (r"\bfinancial literacy\b", "money skills"),
    (r"\boccupational training\b", "job training"),
    (r"\bvocational training\b", "job training"),
    (r"\bscattered-site housing\b", "housing in apartments throughout the community"),
    (r"\blast-dollar scholarship\b", "scholarship that helps cover remaining approved school costs"),
    (r"\bcurrent/former\b", "current or former"),
    (r"\bage/status\b", "age and status"),
    (r"\bpayer\b", "insurance or payment"),
    (r"\bservice capacity\b", "openings"),
    (r"\btreatment capacity\b", "open treatment appointments"),
    (r"\bcapacity-limited\b", "limited by available openings"),
    (r"\bcohort-based\b", "offered in scheduled groups"),
    (r"\bcohort\b", "class or program group"),
    (r"\btrauma-informed\b", "designed with an understanding of trauma"),
)

SECOND_PERSON = re.compile(r"\b(?:you|your|yours|yourself|yourselves)\b", re.IGNORECASE)


def normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def make_third_person(value: str) -> str:
    text = str(value or "")
    grammatical = (
        (r"\bIf you are\b", "If the applicant is"),
        (r"\bif you are\b", "if the applicant is"),
        (r"\bWhen you are\b", "When the applicant is"),
        (r"\bwhen you are\b", "when the applicant is"),
        (r"\bYou are\b", "The applicant is"),
        (r"\byou are\b", "the applicant is"),
        (r"\bYou have\b", "The applicant has"),
        (r"\byou have\b", "the applicant has"),
        (r"\bYou need\b", "The applicant needs"),
        (r"\byou need\b", "the applicant needs"),
        (r"\bYou must\b", "The applicant must"),
        (r"\byou must\b", "the applicant must"),
        (r"\bYou can\b", "The applicant can"),
        (r"\byou can\b", "the applicant can"),
        (r"\bYour\b", "The applicant's"),
        (r"\byour\b", "the applicant's"),
        (r"\bYou\b", "The applicant"),
        (r"\byou\b", "the applicant"),
    )
    for pattern, replacement in grammatical:
        text = re.sub(pattern, replacement, text)
    return text


def plain_text(value: str) -> str:
    text = normalize_whitespace(make_third_person(value))
    for pattern, replacement in REPLACEMENTS:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return normalize_whitespace(text)


def normalize_fields(item: dict, fields: tuple[str, ...]) -> None:
    for field in fields:
        if item.get(field):
            item[field] = plain_text(item[field])


def validate(data: dict) -> None:
    errors: list[str] = []

    for resource in data.get("resources", []):
        name = resource.get("name", "Unnamed resource")
        summary = str(resource.get("referralTrigger", ""))
        if not summary.startswith("Provides "):
            errors.append(f"{name}: card description must start with 'Provides '")

        for field in RESOURCE_FIELDS:
            value = str(resource.get(field, ""))
            if SECOND_PERSON.search(value):
                errors.append(f"{name}: second-person language remains in {field}: {value}")

    for collection, fields in (
        ("triage", ("situation", "firstAction", "backup", "limit")),
        ("fosterPrograms", ("ageWindow", "eligibilityTrigger", "primaryValue", "recommendedAction")),
        ("needsMap", ("strategy",)),
    ):
        for item in data.get(collection, []):
            label = item.get("program") or item.get("domain") or item.get("situation") or collection
            for field in fields:
                value = str(item.get(field, ""))
                if SECOND_PERSON.search(value):
                    errors.append(f"{label}: second-person language remains in {field}: {value}")

    if errors:
        raise SystemExit("Static language validation failed:\n- " + "\n- ".join(errors))


def main() -> None:
    data = json.loads(APP_DATA.read_text(encoding="utf-8"))

    for resource in data.get("resources", []):
        normalize_fields(resource, RESOURCE_FIELDS)

    for item in data.get("triage", []):
        normalize_fields(item, ("situation", "firstAction", "backup", "limit"))

    for item in data.get("fosterPrograms", []):
        normalize_fields(
            item,
            ("ageWindow", "eligibilityTrigger", "primaryValue", "recommendedAction"),
        )

    for item in data.get("needsMap", []):
        normalize_fields(item, ("strategy",))

    validate(data)

    APP_DATA.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print("Normalized and validated static app-data language")


if __name__ == "__main__":
    main()
