from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PART_DIR = ROOT / "phase1"
PARTS = sorted(PART_DIR.glob("part-*.txt"))

if len(PARTS) != 7:
    raise SystemExit(f"Expected 7 Phase 1 fragments, found {len(PARTS)}")

source = "".join(path.read_text(encoding="utf-8") for path in PARTS)
if not source.startswith("(() => {") or not source.rstrip().endswith("})();"):
    raise SystemExit("The assembled Phase 1 source does not have the expected wrapper")

(ROOT / "phase1.js").write_text(source, encoding="utf-8")

for path in PARTS:
    path.unlink()
PART_DIR.rmdir()

vercel_path = ROOT / "vercel.json"
vercel = vercel_path.read_text(encoding="utf-8")
old_csp = "script-src 'self' blob:;"
new_csp = "script-src 'self';"
if old_csp not in vercel:
    raise SystemExit("Expected Blob CSP allowance was not found")
vercel_path.write_text(vercel.replace(old_csp, new_csp), encoding="utf-8")

doc_path = ROOT / "PHASE1.md"
doc = doc_path.read_text(encoding="utf-8")
marker = "## Configuration\n\n"
addition = (
    "## Delivery and security\n\n"
    "Phase 1 is delivered as the checked-in `phase1.js` file. The browser no longer fetches source fragments or executes a generated Blob URL, so the production Content Security Policy does not allow `blob:` scripts. CI syntax-checks the same file that runs in production.\n\n"
)
if addition not in doc:
    if marker not in doc:
        raise SystemExit("Expected PHASE1.md configuration heading was not found")
    doc = doc.replace(marker, addition + marker)
    doc_path.write_text(doc, encoding="utf-8")
