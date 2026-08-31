#!/usr/bin/env python3
"""Rebuild app-data.json from the researched source files.

Presentation descriptions are generated once here and stored in app-data.json.
The browser does not rewrite or simplify service language after rendering.
"""

import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"

PLAIN_LANGUAGE_REPLACEMENTS = (
    (r"\bcase management\b", "help making a plan and connecting to services"),
    (r"\bhousing navigation\b", "help finding housing"),
    (r"\bcare coordination\b", "help organizing care"),
    (r"\bbehavioral-health\b", "mental health"),
    (r"\bbehavioral health\b", "mental health"),
    (r"\bsubstance-use\b", "drug or alcohol recovery"),
    (r"\bpostsecondary\b", "college or career training"),
    (r"\bindependent-living\b", "living-on-your-own"),
    (r"\bindependent living\b", "living on their own"),
    (r"\bself-sufficiency\b", "independence"),
    (r"\bvital documents\b", "IDs and important documents"),
    (r"\bprovider connection\b", "connections to care"),
    (r"\bservice coordination\b", "help coordinating services"),
    (r"\bworkforce development\b", "job and career support"),
    (r"\bfinancial capability\b", "money and budgeting support"),
)


def clean_text(value: str) -> str:
    """Normalize spacing and replace a small set of avoidable jargon."""
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    for pattern, replacement in PLAIN_LANGUAGE_REPLACEMENTS:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return text


def strip_period(value: str) -> str:
    return value.rstrip().rstrip(".")


def lowercase_lead(value: str) -> str:
    """Lowercase a normal sentence lead without damaging acronyms such as HIV."""
    if len(value) > 1 and value[0].isupper() and value[1].islower():
        return value[0].lower() + value[1:]
    return value


def audience_phrase(eligibility: str) -> str:
    """Return a concise third-person audience phrase from the eligibility field."""
    text = clean_text(eligibility)
    if not text:
        return "people who meet the program's requirements"

    # Keep the clearest audience clause. More complex qualifications remain in the detail view.
    text = strip_period(text.split(";", 1)[0])
    text = re.sub(r"^Generally\s+", "", text, flags=re.IGNORECASE)
    text = re.sub(r"^Eligible\s+", "", text, flags=re.IGNORECASE)

    generic_rules = (
        r"^Program-specific .+",
        r"^Eligibility varies .+",
        r"^Programs vary.+",
        r"^Income and program-specific .+",
    )
    if any(re.match(pattern, text, flags=re.IGNORECASE) for pattern in generic_rules):
        return "people who meet the program's requirements"

    if re.match(r"^(Income|Federal|Qualifying|Current) .+ (rules|criteria|requirements) apply$", text, flags=re.IGNORECASE):
        return f"people who meet {lowercase_lead(text).removesuffix(' apply')}"

    if re.match(r"^A (physical|mental|intellectual|sensory)", text, flags=re.IGNORECASE):
        return "people with " + lowercase_lead(text[2:])

    replacements = (
        (r"^Community patients\b", "community members"),
        (r"^Open to community patients\b", "community members"),
        (r"^Patients seeking\b", "people seeking"),
    )
    for pattern, replacement in replacements:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)

    return lowercase_lead(text)


def service_description(resource: dict[str, str]) -> str:
    """Create the stored card description using service + audience fields."""
    service = clean_text(resource.get("provides", ""))
    audience = audience_phrase(resource.get("eligibility", ""))

    if not service:
        service = clean_text(resource.get("referralTrigger", "community support"))

    service = re.sub(r"^Provides\s+", "", service, flags=re.IGNORECASE)
    service = lowercase_lead(strip_period(service))
    description = f"Provides {service} for {strip_period(audience)}."

    # Stored descriptions must remain third person.
    description = re.sub(r"\byour\b", "the applicant's", description, flags=re.IGNORECASE)
    description = re.sub(r"\byou\b", "the applicant", description, flags=re.IGNORECASE)
    return re.sub(r"\s+", " ", description).strip()


with (DATA / "resources.csv").open(newline="", encoding="utf-8") as handle:
    resources = list(csv.DictReader(handle))
    for resource in resources:
        try:
            resource["id"] = int(resource["id"])
        except (ValueError, TypeError):
            pass

        # Keep this listing neutral: My Farm Camps Experience is not affiliated with the program.
        if resource.get("name") == "My Farm Camps Experience":
            resource["notes"] = (
                "Potential experiential or partnership resource; not a guaranteed clinical referral."
            )

        resource["referralTrigger"] = service_description(resource)

support = json.loads((DATA / "support-data.json").read_text(encoding="utf-8"))
support["resources"] = resources
support.setdefault("meta", {})["resourceCount"] = len(resources)
(DATA / "app-data.json").write_text(
    json.dumps(support, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
print(f"Wrote data/app-data.json with {len(resources)} static service descriptions")
