#!/usr/bin/env python3
"""Check every external URL used by the static Resource Navigator.

The audit follows redirects, records response status and page title, and distinguishes
missing pages from official sites that block automated requests. Service sources are also
classified as government, first-party provider, or needing manual ownership review.
"""

from __future__ import annotations

import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

import requests

ROOT = Path(__file__).resolve().parents[1]
APP_DATA = ROOT / "data" / "app-data.json"
AUDIT_DIR = ROOT / "audits"
AUDIT_JSON = AUDIT_DIR / "source-url-audit.json"
AUDIT_MD = AUDIT_DIR / "source-url-audit.md"

STOP_WORDS = {
    "and", "the", "of", "for", "to", "a", "an", "program", "project", "services",
    "service", "center", "centers", "county", "north", "carolina", "charlotte",
    "mecklenburg", "community", "resource", "resources", "young", "adult", "youth",
    "nc", "inc", "org", "foundation", "association", "department", "division",
}

KNOWN_GOVERNMENT_HOSTS = {
    "988lifeline.org",
    "benefits.gov",
    "charlottenc.gov",
    "healthcare.gov",
    "hud.gov",
    "mecknc.gov",
    "medicaid.ncdhhs.gov",
    "nc.gov",
    "ncdhhs.gov",
    "neglected-delinquent.ed.gov",
    "ssa.gov",
    "studentaid.gov",
    "usa.gov",
}

KNOWN_FIRST_PARTY_HOSTS = {
    "cfnc.org",
    "cfknc.org",
    "charlotte.edu",
    "chsnc.org",
    "cpcc.edu",
    "ihclt.org",
    "mhaofcc.org",
    "nc211.org",
    "nourishup.org",
    "project658.com",
    "raoassist.org",
    "safealliance.org",
    "score.org",
    "smartstartofmeck.org",
    "sutlnc.org",
}

THIRD_PARTY_PLATFORM_HOSTS = {
    "bit.ly",
    "docs.google.com",
    "drive.google.com",
    "facebook.com",
    "findhelp.org",
    "forms.gle",
    "instagram.com",
    "linktr.ee",
    "sites.google.com",
    "tinyurl.com",
    "youtube.com",
}

BLOCKED_STATUSES = {401, 403, 429}
MISSING_STATUSES = {404, 410}


def clean_host(value: str) -> str:
    return (urlparse(value).hostname or "").lower().removeprefix("www.")


def root_host(host: str) -> str:
    parts = host.split(".")
    return ".".join(parts[-2:]) if len(parts) >= 2 else host


def host_matches(host: str, candidates: set[str]) -> bool:
    return any(host == candidate or host.endswith(f".{candidate}") for candidate in candidates)


def words(value: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[a-z0-9]+", value.lower())
        if len(token) >= 3 and token not in STOP_WORDS
    }


def source_classification(entry: dict) -> tuple[str, list[str]]:
    url = entry["url"]
    host = clean_host(url)
    root = root_host(host)
    source_types = set(entry.get("sourceTypes", []))
    flags: list[str] = []

    if urlparse(url).scheme != "https":
        flags.append("not-https")

    if source_types == {"interface"}:
        return "interface-link", flags
    if source_types == {"metadata"}:
        return "internal-reference", flags

    if host.endswith(".gov") or ".gov." in host or host_matches(host, KNOWN_GOVERNMENT_HOSTS):
        return "official-government", flags

    if host_matches(host, KNOWN_FIRST_PARTY_HOSTS):
        return "official-first-party", flags

    if root in THIRD_PARTY_PLATFORM_HOSTS or host in THIRD_PARTY_PLATFORM_HOSTS:
        flags.append("third-party-platform")
        return "manual-review", flags

    label_tokens = set().union(*(words(label) for label in entry["labels"]))
    host_compact = re.sub(r"[^a-z0-9]", "", root.lower())
    host_tokens = words(root.replace(".", " "))

    exact_token_match = bool(label_tokens & host_tokens)
    embedded_token_match = any(token in host_compact for token in label_tokens if len(token) >= 4)

    if exact_token_match or embedded_token_match:
        return "likely-first-party", flags

    flags.append("host-not-clearly-matched")
    return "manual-review", flags


def extract_title(html: str) -> str:
    match = re.search(r"<title[^>]*>(.*?)</title>", html, flags=re.IGNORECASE | re.DOTALL)
    if not match:
        return ""
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", match.group(1))).strip()[:180]


def inspect_url(entry: dict) -> dict:
    url = entry["url"]
    result = dict(entry)
    classification, flags = source_classification(entry)
    result.update(
        {
            "classification": classification,
            "flags": flags,
            "status": None,
            "finalUrl": "",
            "finalHost": "",
            "title": "",
            "error": "",
        }
    )

    path = urlparse(url).path or "/"
    if path in {"", "/"} and classification not in {"interface-link", "internal-reference"}:
        result["flags"].append("generic-homepage")

    try:
        response = requests.get(
            url,
            timeout=18,
            allow_redirects=True,
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; ResourceNavigatorLinkAudit/1.0; +https://ya-resource-navigator.vercel.app)"
            },
        )
        result["status"] = response.status_code
        result["finalUrl"] = response.url
        result["finalHost"] = clean_host(response.url)
        if "text/html" in response.headers.get("content-type", ""):
            result["title"] = extract_title(response.text[:250000])

        if response.status_code in MISSING_STATUSES:
            result["flags"].append("missing-page")
        elif response.status_code in BLOCKED_STATUSES:
            result["flags"].append("automated-access-blocked")
        elif response.status_code >= 500:
            result["flags"].append("server-error")
        elif response.status_code >= 400:
            result["flags"].append("http-error")

        if root_host(clean_host(url)) != root_host(clean_host(response.url)):
            result["flags"].append("redirected-to-different-host")
    except requests.RequestException as exc:
        result["error"] = f"{type(exc).__name__}: {exc}"[:300]
        result["flags"].append("automated-check-failed")

    result["flags"] = sorted(set(result["flags"]))
    return result


def collect_entries(data: dict) -> list[dict]:
    grouped: dict[str, dict] = {}

    def add(url: str, label: str, source_type: str) -> None:
        if not str(url).startswith(("http://", "https://")):
            return
        item = grouped.setdefault(url, {"url": url, "labels": [], "sourceTypes": []})
        if label not in item["labels"]:
            item["labels"].append(label)
        if source_type not in item["sourceTypes"]:
            item["sourceTypes"].append(source_type)

    for resource in data.get("resources", []):
        add(resource.get("sourceUrl", ""), resource.get("name", "Unnamed resource"), "resource")

    for program in data.get("fosterPrograms", []):
        add(program.get("sourceUrl", ""), program.get("program", "Unnamed foster program"), "foster-guide")

    document_review = data.get("meta", {}).get("documentReview", {})
    add(document_review.get("url", ""), document_review.get("title", "Research document"), "metadata")

    config_text = (ROOT / "config.js").read_text(encoding="utf-8")
    for url in re.findall(r"https?://[^'\"\s)]+", config_text):
        add(url, "Interface link", "interface")

    return sorted(grouped.values(), key=lambda item: item["url"])


def markdown_report(report: dict) -> str:
    rows = report["results"]
    flagged = [row for row in rows if row["flags"]]
    manual = [row for row in rows if row["classification"] == "manual-review"]
    missing = [row for row in rows if "missing-page" in row["flags"]]
    blocked = [
        row
        for row in rows
        if "automated-access-blocked" in row["flags"] or "automated-check-failed" in row["flags"]
    ]
    server_errors = [row for row in rows if "server-error" in row["flags"]]

    lines = [
        "# Source URL Audit",
        "",
        f"Generated: {report['generatedAt']}",
        "",
        f"- Unique URLs checked: **{len(rows)}**",
        f"- Missing pages (404/410): **{len(missing)}**",
        f"- Automated access blocked or inconclusive: **{len(blocked)}**",
        f"- Server errors: **{len(server_errors)}**",
        f"- Manual official-source review: **{len(manual)}**",
        f"- URLs with any flag: **{len(flagged)}**",
        "",
        "A blocked or inconclusive automated request does not mean a public page is broken. Those links require a browser or manual search check. `manual-review` means the host ownership is not evident from the organization name alone.",
        "",
        "## Flagged links",
        "",
        "| Resource | Status | Source classification | Flags | URL | Final URL |",
        "|---|---:|---|---|---|---|",
    ]

    for row in flagged:
        labels = "; ".join(row["labels"]).replace("|", "\\|")
        flags = ", ".join(row["flags"]).replace("|", "\\|")
        status = row["status"] if row["status"] is not None else "—"
        lines.append(
            f"| {labels} | {status} | {row['classification']} | {flags} | {row['url']} | {row['finalUrl']} |"
        )

    lines.extend(
        [
            "",
            "## All checked links",
            "",
            "| Resource | Status | Classification | Page title | URL |",
            "|---|---:|---|---|---|",
        ]
    )
    for row in rows:
        labels = "; ".join(row["labels"]).replace("|", "\\|")
        title = row["title"].replace("|", "\\|")
        status = row["status"] if row["status"] is not None else "—"
        lines.append(
            f"| {labels} | {status} | {row['classification']} | {title} | {row['url']} |"
        )

    return "\n".join(lines) + "\n"


def main() -> None:
    data = json.loads(APP_DATA.read_text(encoding="utf-8"))
    entries = collect_entries(data)

    results: list[dict] = []
    with ThreadPoolExecutor(max_workers=12) as executor:
        futures = {executor.submit(inspect_url, entry): entry for entry in entries}
        for future in as_completed(futures):
            results.append(future.result())

    results.sort(key=lambda row: (not row["flags"], row["labels"][0].lower(), row["url"]))
    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "results": results,
    }

    AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    AUDIT_JSON.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    AUDIT_MD.write_text(markdown_report(report), encoding="utf-8")

    missing = sum(1 for row in results if "missing-page" in row["flags"])
    blocked = sum(
        1
        for row in results
        if "automated-access-blocked" in row["flags"] or "automated-check-failed" in row["flags"]
    )
    manual = sum(1 for row in results if row["classification"] == "manual-review")
    print(
        f"Checked {len(results)} unique URLs; {missing} missing pages; "
        f"{blocked} blocked/inconclusive; {manual} need manual source review"
    )


if __name__ == "__main__":
    main()
