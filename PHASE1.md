# Phase 1 navigation enhancements

Phase 1 keeps the existing static directory and adds a navigation layer without collecting personally identifying information or introducing a backend.

## Added

- Two audience entry points: **I need help** and **I’m helping someone**
- Three structured pathways:
  - safe housing needed tonight
  - housing may end within days or weeks
  - several needs are competing at once
- A separate pathway-role label and information-freshness label
- Per-listing freshness language based on the listing’s own `lastVerified` date
- Action-oriented resource details, including inferred intake method, referral requirement, documents to prepare and follow-up expectations
- A device-only support plan with status and follow-up date
- “Report outdated information” actions that prepare a public GitHub issue and warn against including personal information
- Support-by-need cards that open matching directory filters
- Clearer “Directory priority” language instead of implying algorithmic recommendations

## Data model

The existing workbook and `resources.csv` remain the source for resource records. Phase 1 derives two presentation fields at runtime:

- `pathwayRole` from the existing priority classification
- `verification` from `lastVerified` and configurable freshness thresholds

Structured pathway definitions live in `data/pathways.json` and reference existing resource IDs. This prevents the first pilot from requiring a full migration of all 139 records.

## Privacy and limitations

- The guided flow does not request names, exact addresses, dates of birth, Social Security numbers or case histories.
- The support plan is stored in the browser’s local storage and is not shared between devices.
- The correction form opens a public GitHub issue. It explicitly instructs users not to include personal or case information.
- Intake status, required documents and response times are inferred conservatively from current listing text when a structured value is unavailable. The interface labels unknown information as something to confirm directly.

## Configuration

Phase 1 settings are in `config.js`:

```js
phase1Enabled: true,
feedbackUrl: 'https://github.com/maxzalaquett-maker/ya-resource-navigator/issues/new',
verificationFreshDays: 30,
verificationCurrentDays: 90,
verificationAgingDays: 180
```

## Next validation step

Test the guided pathways with young adults and helpers using realistic scenarios. Measure whether users identify a plausible first action, understand what to prepare and reach a known referral outcome.
