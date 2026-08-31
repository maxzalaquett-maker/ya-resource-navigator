#!/usr/bin/env python3
"""Rebuild the final static app-data.json from researched source files.

Presentation descriptions and data corrections are generated once here and stored in
app-data.json. The browser does not rewrite, simplify or replace service language.
"""

import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"

EXCLUDED_ORGANIZATION_NAMES = (
    "mecklenburg gear up",
    "gear up pilot",
    "hud foster youth to independence",
    "hud fyi voucher",
    "targeted housing assistance program",
    "thap-in",
    "buildstrong academy",
    "agape acres",
    "my farm camps experience",
)

PROPER_AUDIENCE_LEADS = {
    "Alliance",
    "Cabarrus",
    "CATS",
    "Charlotte",
    "Gaston",
    "Greater",
    "LGBTQ+",
    "Medicaid",
    "Mecklenburg",
    "NC",
    "North",
    "Rock",
    "South",
    "UNC",
    "Union",
    "York",
}

PLAIN_LANGUAGE_REPLACEMENTS = (
    (r"\bcase management\b", "help making a plan and connecting to services"),
    (r"\bcase navigation\b", "help applying for services"),
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
    (r"\bfinancial literacy\b", "money skills"),
    (r"\boccupational training\b", "job training"),
    (r"\bscattered-site housing\b", "housing in apartments throughout the community"),
    (r"\blast-dollar scholarship\b", "scholarship that helps cover remaining approved school costs"),
)


def is_excluded_organization(value: str) -> bool:
    name = str(value or "").lower()
    return any(excluded in name for excluded in EXCLUDED_ORGANIZATION_NAMES)


def remove_excluded_options(value: str) -> str:
    options = (option.strip() for option in str(value or "").split(";"))
    return "; ".join(
        option
        for option in options
        if option
        and not is_excluded_organization(option)
        and "Time Out Youth" not in option
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
    if len(value) > 1 and value[0].isupper() and value[1].islower():
        return value[0].lower() + value[1:]
    return value


def audience_case(value: str) -> str:
    first_word = value.split(maxsplit=1)[0].strip("\"'()[]{}.,:;") if value else ""
    if first_word in PROPER_AUDIENCE_LEADS or (first_word.isupper() and len(first_word) > 1):
        return value
    return lowercase_lead(value)


def audience_phrase(eligibility: str) -> str:
    """Return a concise third-person audience phrase from the eligibility field."""
    text = clean_text(eligibility)
    if not text:
        return "people who meet the program's requirements"

    # Keep the clearest audience clause. Complex qualifications remain in the detail view.
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

    if re.match(
        r"^(Income|Federal|Qualifying|Current) .+ (rules|criteria|requirements) apply$",
        text,
        flags=re.IGNORECASE,
    ):
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

    return audience_case(text)


def service_phrase(value: str) -> str:
    service = clean_text(value)
    service = re.sub(r"^Provides\s+", "", service, flags=re.IGNORECASE)
    service = lowercase_lead(strip_period(service))

    # Add an article where the source field begins with a singular countable service.
    article_patterns = (
        r"^[\w-]+ directory\b",
        r"^community entry process\b",
        r"^[\w-]+ health plan\b",
        r"^[\w-]+ scholarship\b",
        r"^[\w-]+ support pathway\b",
        r"^county list\b",
    )
    if not re.match(r"^(a|an|the)\b", service, flags=re.IGNORECASE) and any(
        re.match(pattern, service, flags=re.IGNORECASE) for pattern in article_patterns
    ):
        article = "an" if service[:1].lower() in "aeiou" else "a"
        service = f"{article} {service}"

    return service


def service_description(resource: dict[str, str]) -> str:
    """Create the stored card description using service + audience fields."""
    service = service_phrase(resource.get("provides", ""))
    audience = audience_phrase(resource.get("eligibility", ""))

    if not service:
        service = service_phrase(resource.get("referralTrigger", "community support"))

    description = f"Provides {service} for {strip_period(audience)}."

    # Stored descriptions must remain third person.
    description = re.sub(r"\byour\b", "the applicant's", description, flags=re.IGNORECASE)
    description = re.sub(r"\byou\b", "the applicant", description, flags=re.IGNORECASE)
    return re.sub(r"\s+", " ", description).strip()


def apply_women_in_transition(resource: dict[str, str]) -> None:
    resource.update(
        {
            "supportAreas": "Housing / homelessness; Employment / workforce; Soft skills / life skills; Financial capability; Community / belonging",
            "name": "YWCA Central Carolinas — Women in Transition",
            "fosterSpecific": "No",
            "priority": "Specialized",
            "eligibility": "Single women age 18 or older who live without children, have at least $700 in monthly take-home income, earn no more than 60% of the area median income and can live in a shared home with limited staff supervision.",
            "provides": "Affordable month-to-month housing for up to 18 months, including utilities, employment support, budgeting help, workshops, computer and internet access, social activities and a fitness-center membership.",
            "access": "A partner organization or Coordinated Assessment must submit the application. Applicants should provide income information and documents showing their housing situation.",
            "phone": "980-283-2334",
            "location": "YWCA Central Carolinas, Charlotte / Mecklenburg County.",
            "caveat": "This is not emergency housing. Openings depend on room availability. Applicants in recovery from drug or alcohol use must have six months without use before applying.",
            "sourceUrl": "https://ywcacentralcarolinas.org/programs/housing/women-in-transition/",
            "lastVerified": "2026-08-14",
            "referralStatus": "Not contacted",
            "notes": "A partner organization must submit the application. Incomplete applications are not added to the waiting list.",
            "area": "Charlotte / Mecklenburg",
            "areaGroup": "Charlotte / Mecklenburg",
            "radiusNote": "Located in Charlotte and serving Mecklenburg County.",
        }
    )


with (DATA / "resources.csv").open(newline="", encoding="utf-8") as handle:
    source_resources = list(csv.DictReader(handle))

resources = []
for resource in source_resources:
    try:
        resource["id"] = int(resource["id"])
    except (ValueError, TypeError):
        pass

    if resource.get("name") in {
        "YWCA Central Carolinas — Transitional Housing",
        "YWCA Central Carolinas — Women in Transition",
    }:
        apply_women_in_transition(resource)

    if resource.get("priority") == "Verify":
        continue
    if "Time Out Youth" in str(resource.get("name", "")):
        continue
    if is_excluded_organization(resource.get("name", "")):
        continue

    resource["referralTrigger"] = service_description(resource)
    resources.append(resource)

support = json.loads((DATA / "support-data.json").read_text(encoding="utf-8"))

support["triage"] = [
    {
        "situation": "A young adult needs counseling or emotional support related to identity, relationships or sexuality",
        "firstAction": "Mental Health America of Central Carolinas — Counseling",
        "phone": "704-565-3315",
        "backup": "The Barnabas Center also provides professional counseling with a faith-based option. The 988 Lifeline provides immediate crisis support, and 911 is appropriate for immediate danger.",
        "limit": "Counseling availability and fit vary. The young adult or support person should call first to ask about openings, cost and whether the counselor can meet the identified needs.",
    }
    if item.get("firstAction") == "Time Out Youth"
    else item
    for item in support.get("triage", [])
]

support["fosterPrograms"] = [
    item
    for item in support.get("fosterPrograms", [])
    if not is_excluded_organization(item.get("program", ""))
]

for item in support.get("needsMap", []):
    item["primaryOptions"] = remove_excluded_options(item.get("primaryOptions", ""))
    item["backupOptions"] = remove_excluded_options(item.get("backupOptions", ""))

support["partnerships"] = [
    item
    for item in support.get("partnerships", [])
    if "Time Out Youth" not in str(item.get("organization", ""))
    and not is_excluded_organization(item.get("organization", ""))
]

support["resources"] = resources
support.setdefault("meta", {})["resourceCount"] = len(resources)
(DATA / "app-data.json").write_text(
    json.dumps(support, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
print(f"Wrote data/app-data.json with {len(resources)} static service descriptions")
