# FARM127 Resource Navigator

A searchable, mobile-friendly resource directory built from the FARM127 Charlotte Young Adult Resource Directory workbook.

## Included

- 139 researched resources with search, filters and pagination
- Mentorship and soft-skills filters, including leadership, workplace readiness, financial capability and independent-living development
- Local-area filter for Charlotte/Mecklenburg, surrounding communities within roughly 30 miles, and statewide/national fallbacks
- Urgent triage guide
- Foster-care-specific program guide
- Support-plan needs map
- Saved resources stored in the browser
- Shareable filtered URLs
- Printable views
- Optional internal partnership planner stored locally in the browser
- Original Excel workbook and a no-dependency import script

## Deploy to Vercel

This is a static HTML/CSS/JavaScript project. It does not need a framework, database, environment variables or a build command.

### GitHub method

1. Create a new GitHub repository.
2. Upload the contents of this folder to the repository root.
3. In Vercel, choose **Add New → Project** and import the repository.
4. Leave **Framework Preset** as **Other**.
5. Leave the build and output settings blank, then deploy.

Every later push to the connected branch will create a new deployment.

### Vercel CLI method

From this folder:

```bash
vercel
```

Follow the prompts. For production:

```bash
vercel --prod
```

## Run locally

Browsers block `fetch()` from local `file://` pages, so use a local web server:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Update the directory from Excel

1. Replace `source/FARM127_Charlotte_Young_Adult_Resource_Directory.xlsx` with the updated workbook.
2. Keep these worksheet names and header labels unchanged:
   - `Resource Directory`
   - `Start Here`
   - `Foster Programs`
   - `Needs Map`
   - `Partnership Priorities`
3. Run:

```bash
python3 scripts/import_xlsx.py
```

The script uses only Python's standard library. It rebuilds:

- `data/app-data.json`
- `data/resources.csv`

Commit and push those changes to redeploy the app.

To import a workbook from another location:

```bash
python3 scripts/import_xlsx.py /path/to/resource-directory.xlsx
```

## Update from CSV instead

Edit `data/resources.csv`, then run:

```bash
python3 scripts/build_data.py
```

This keeps the triage, foster guide, needs map and partnership data from `data/support-data.json`.

## Public versus internal deployment

The partnership planner is hidden by default because it is intended for FARM127 staff. To enable it for a private deployment, edit `config.js`:

```js
window.FARM127_CONFIG = {
  showPartnershipPlanner: true,
  pageSize: 18
};
```

The planner uses `localStorage`; its edits are not shared between users or devices. A shared multi-user tracker would require authentication and a database.

## Important limitation

This app is a referral directory, not a real-time availability system. Shelter beds, funding, waitlists, eligibility and intake processes must be confirmed directly with each provider.


## About the 30-mile expansion

“Local / nearby” is a practical service-area classification. It includes Charlotte/Mecklenburg and organizations in nearby communities such as Matthews, Indian Trail, Monroe, Concord, Huntersville, Davidson, Gastonia, Belmont and Rock Hill when they are plausibly within roughly 30 road miles of Uptown Charlotte. County, ZIP-code and residency restrictions still control eligibility.


## FARM127 Resource Database 2024 review

Reviewed August 5, 2026. Twelve relevant organizations or distinct programs were added; duplicates were merged or enriched. See `DOCUMENT_REVIEW.md` for every disposition.

Source: https://docs.google.com/document/d/1dhb3z0FQSU4lBnmB14-WSQ-LKLhe9QBqxWcJZP9nmy0/edit?usp=sharing
