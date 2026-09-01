from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def replace_once(content: str, old: str, new: str, label: str) -> str:
    count = content.count(old)
    if count != 1:
        raise RuntimeError(f"Expected one {label} match, found {count}")
    return content.replace(old, new, 1)


def replace_regex(content: str, pattern: str, replacement: str, label: str) -> str:
    updated, count = re.subn(pattern, replacement, content, count=1, flags=re.DOTALL)
    if count != 1:
        raise RuntimeError(f"Expected one {label} match, found {count}")
    return updated


RESOURCE_FILTER = r"""(function (root, factory) {
  'use strict';

  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) root.ResourceFilter = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';

  const SUPPORT_PREFIX = '__rn_support__:';
  const QUERY_PREFIX = '__rn_query__:';

  const STRONG_URGENT_SIGNALS = [
    'call 911', 'call or text 988', '988', '24/7', '24 hours', 'crisis line',
    'crisis hotline', 'emergency shelter', 'emergency food', 'same day', 'same-day',
    'tonight', 'immediate danger', 'overdose', 'domestic violence', 'sexual assault',
    'human trafficking', 'coordinated entry', 'shelter bed', 'walk-in crisis', 'urgent care'
  ];

  const URGENT_AREAS = [
    'housing / homelessness',
    'food and basic needs',
    'food / essentials',
    'mental health',
    'mental health / recovery',
    'safety / domestic violence / trafficking',
    'substance-use recovery'
  ];

  const URGENT_ACCESS_SIGNALS = [
    'emergency', 'crisis', 'hotline', 'immediate', 'walk-in', 'shelter', 'same day'
  ];

  function normalize(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  function tagList(value) {
    return String(value || '')
      .split(';')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function encodeSupportValue(values) {
    const selected = [...new Set((values || []).map(String).map((value) => value.trim()).filter(Boolean))];
    if (!selected.length) return 'all';
    if (selected.length === 1) return selected[0];
    return `${SUPPORT_PREFIX}${selected.map((value) => encodeURIComponent(value)).join('~')}`;
  }

  function decodeSupportValue(value) {
    const input = String(value || '');
    if (!input || input === 'all') return [];
    if (!input.startsWith(SUPPORT_PREFIX)) return [input];
    return input.slice(SUPPORT_PREFIX.length).split('~').map((item) => {
      try {
        return decodeURIComponent(item);
      } catch {
        return item;
      }
    }).map((item) => item.trim()).filter(Boolean);
  }

  function encodeQueryValue(text, urgent, options = {}) {
    const params = new URLSearchParams();
    if (options.charlotte !== false) params.set('scope', 'charlotte');
    params.set('urgent', urgent ? '1' : '0');
    const normalizedText = normalize(text);
    if (normalizedText) params.set('text', normalizedText);
    return `${QUERY_PREFIX}${params.toString()}`;
  }

  function decodeQueryValue(value) {
    const input = String(value || '');
    if (!input.startsWith(QUERY_PREFIX)) {
      return { text: input, urgent: false, charlotte: false };
    }

    const params = new URLSearchParams(input.slice(QUERY_PREFIX.length));
    return {
      text: params.get('text') || '',
      urgent: params.get('urgent') === '1',
      charlotte: params.get('scope') === 'charlotte'
    };
  }

  function buildSearchText(resource) {
    return normalize([
      resource?.name,
      resource?.supportAreas,
      resource?.referralTrigger,
      resource?.eligibility,
      resource?.provides,
      resource?.access,
      resource?.location,
      resource?.phone,
      resource?.caveat,
      resource?.fosterSpecific,
      resource?.priority,
      resource?.area,
      resource?.areaGroup,
      resource?.radiusNote
    ].join(' '));
  }

  function matchesUrgentNeed(value) {
    const haystack = normalize(value);
    if (STRONG_URGENT_SIGNALS.some((signal) => haystack.includes(signal))) return true;

    return URGENT_AREAS.some((area) => haystack.includes(area))
      && URGENT_ACCESS_SIGNALS.some((signal) => haystack.includes(signal))
      && !haystack.includes('not an emergency service');
  }

  function normalizeFilters(filters = {}) {
    const decodedQuery = filters.query !== undefined
      ? decodeQueryValue(filters.query)
      : { text: filters.text || '', urgent: false, charlotte: false };

    const supportValues = Array.isArray(filters.supportValues)
      ? filters.supportValues.map(String).filter(Boolean)
      : decodeSupportValue(filters.support || 'all');

    return {
      text: filters.text !== undefined ? String(filters.text || '') : decodedQuery.text,
      urgent: Boolean(filters.urgent ?? decodedQuery.urgent),
      charlotteOnly: Boolean(filters.charlotteOnly ?? decodedQuery.charlotte),
      supportValues,
      foster: filters.foster || 'all',
      area: filters.area || 'all',
      priority: filters.priority || 'all',
      savedOnly: Boolean(filters.savedOnly),
      savedIds: filters.savedIds instanceof Set
        ? filters.savedIds
        : new Set(Array.isArray(filters.savedIds) ? filters.savedIds.map(String) : [])
    };
  }

  function matchesResource(resource, filters = {}) {
    const current = normalizeFilters(filters);
    const supportAreas = tagList(resource?.supportAreas);

    if (current.supportValues.length
      && !current.supportValues.some((value) => supportAreas.includes(value))) return false;

    if (current.area !== 'all' && resource?.areaGroup !== current.area) return false;
    if (current.priority !== 'all' && resource?.priority !== current.priority) return false;

    if (current.foster !== 'all') {
      const foster = normalize(resource?.fosterSpecific);
      if (current.foster === 'yes' && foster !== 'yes') return false;
      if (current.foster === 'partial' && foster !== 'partial') return false;
      if (current.foster === 'no' && foster !== 'no') return false;
    }

    if (current.savedOnly && !current.savedIds.has(String(resource?.id))) return false;

    const haystack = buildSearchText(resource);
    if (current.charlotteOnly && haystack.includes('surrounding communities')) return false;
    if (current.text && !haystack.includes(normalize(current.text))) return false;
    if (current.urgent && !matchesUrgentNeed(haystack)) return false;

    return true;
  }

  function filterResources(resources, filters = {}) {
    return (Array.isArray(resources) ? resources : [])
      .filter((resource) => matchesResource(resource, filters));
  }

  return Object.freeze({
    SUPPORT_PREFIX,
    QUERY_PREFIX,
    normalize,
    tagList,
    encodeSupportValue,
    decodeSupportValue,
    encodeQueryValue,
    decodeQueryValue,
    buildSearchText,
    matchesUrgentNeed,
    normalizeFilters,
    matchesResource,
    filterResources
  });
});
"""


UNIT_TESTS = r"""'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const nativeArrayIncludes = Array.prototype.includes;
const nativeStringIncludes = String.prototype.includes;
const filter = require('../../resource-filter.js');

const resources = [
  {
    id: 1,
    name: 'Emergency Housing Line',
    supportAreas: 'Housing / homelessness;Navigation / case management',
    referralTrigger: 'Needs an emergency shelter bed tonight',
    eligibility: 'Young adults',
    provides: 'Emergency housing navigation',
    access: 'Call the 24/7 crisis line',
    location: 'Charlotte',
    phone: '704-555-0101',
    caveat: 'Availability changes daily',
    fosterSpecific: 'Yes',
    priority: 'Core',
    area: 'Mecklenburg County',
    areaGroup: 'Charlotte / Mecklenburg',
    radiusNote: ''
  },
  {
    id: 2,
    name: 'Nearby Career Center',
    supportAreas: 'Employment / workforce',
    referralTrigger: 'Looking for a job',
    eligibility: 'Adults',
    provides: 'Job coaching',
    access: 'Make an appointment',
    location: 'Nearby community',
    fosterSpecific: 'No',
    priority: 'Backup',
    area: 'Union County',
    areaGroup: 'Surrounding communities'
  },
  {
    id: 3,
    name: 'Statewide Education Aid',
    supportAreas: 'Education',
    referralTrigger: 'Needs help paying for school',
    eligibility: 'North Carolina residents',
    provides: 'Education assistance',
    access: 'Apply online',
    location: 'Statewide',
    fosterSpecific: 'Partial',
    priority: 'Specialized',
    area: 'North Carolina',
    areaGroup: 'Statewide / national'
  }
];

test('loading the module does not replace native includes methods', () => {
  assert.equal(Array.prototype.includes, nativeArrayIncludes);
  assert.equal(String.prototype.includes, nativeStringIncludes);
});

test('support selections round-trip and use OR matching', () => {
  const encoded = filter.encodeSupportValue(['Housing / homelessness', 'Education']);
  assert.deepEqual(filter.decodeSupportValue(encoded), ['Housing / homelessness', 'Education']);
  assert.deepEqual(
    filter.filterResources(resources, { support: encoded }).map((resource) => resource.id),
    [1, 3]
  );
});

test('encoded queries preserve text, urgent, and Charlotte scope', () => {
  const urgentQuery = filter.encodeQueryValue('', true);
  assert.deepEqual(
    filter.filterResources(resources, { query: urgentQuery }).map((resource) => resource.id),
    [1]
  );

  const careerQuery = filter.encodeQueryValue('career', false);
  assert.deepEqual(filter.filterResources(resources, { query: careerQuery }), []);

  const statewideQuery = filter.encodeQueryValue('education', false);
  assert.deepEqual(
    filter.filterResources(resources, { query: statewideQuery }).map((resource) => resource.id),
    [3]
  );
});

test('saved, foster, area, and priority filters compose predictably', () => {
  assert.deepEqual(
    filter.filterResources(resources, {
      savedOnly: true,
      savedIds: new Set(['1', '3']),
      foster: 'yes',
      area: 'Charlotte / Mecklenburg',
      priority: 'Core'
    }).map((resource) => resource.id),
    [1]
  );
});

test('urgent matching excludes listings that explicitly deny emergency service', () => {
  assert.equal(filter.matchesUrgentNeed('Emergency housing crisis hotline'), true);
  assert.equal(filter.matchesUrgentNeed('Mental health support; not an emergency service'), false);
});
"""


# Create the shared filter module and its unit tests.
write("resource-filter.js", RESOURCE_FILTER)
write("tests/unit/resource-filter.test.js", UNIT_TESTS)


# Load the filter module before every consumer.
index = read("index.html")
index = replace_once(
    index,
    '  <script src="/config.js" defer></script>\n  <script src="/mobile.js" defer></script>',
    '  <script src="/config.js" defer></script>\n  <script src="/resource-filter.js" defer></script>\n  <script src="/mobile.js" defer></script>',
    "index script order",
)
write("index.html", index)


# Make the application call the matcher explicitly instead of relying on patched prototypes.
app = read("app.js")
app = replace_once(
    app,
    "  const config = Object.assign({ showPartnershipPlanner: false, pageSize: 18 }, window.RESOURCE_NAVIGATOR_CONFIG || {});\n",
    "  const config = Object.assign({ showPartnershipPlanner: false, pageSize: 18 }, window.RESOURCE_NAVIGATOR_CONFIG || {});\n  const resourceFilter = window.ResourceFilter;\n  if (!resourceFilter) throw new Error('ResourceFilter must load before app.js');\n",
    "app filter dependency",
)
app = replace_regex(
    app,
    r"  function getFilteredResources\(\) \{\n    const query = normalize\(state\.query\);\n    const priorityRank = \{ Core: 1, Specialized: 2, Backup: 3, Verify: 4 \};\n\n    const filtered = state\.data\.resources\.filter\(\(resource\) => \{.*?\n      return true;\n    \}\);",
    """  function getFilteredResources() {
    const priorityRank = { Core: 1, Specialized: 2, Backup: 3, Verify: 4 };

    const filtered = resourceFilter.filterResources(state.data.resources, {
      query: state.query,
      support: state.support,
      area: state.area,
      foster: state.foster,
      priority: state.priority,
      savedOnly: state.savedOnly,
      savedIds: state.saved
    });""",
    "app filter implementation",
)
write("app.js", app)


# Remove global Array/String prototype mutation and use the shared codec functions.
mobile = read("mobile.js")
mobile = replace_regex(
    mobile,
    r"  const MOBILE_BREAKPOINT = 760;\n  const SUPPORT_PREFIX = '__rn_support__:';\n  const QUERY_PREFIX = '__rn_query__:';\n  const originalArrayIncludes = Array\.prototype\.includes;\n  const originalStringIncludes = String\.prototype\.includes;\n\n  loadFilterStyles\(\);\n  installFilterMatchers\(\);",
    """  const MOBILE_BREAKPOINT = 760;
  const resourceFilter = window.ResourceFilter;
  if (!resourceFilter) {
    console.error('ResourceFilter must load before mobile.js');
    return;
  }
  const {
    SUPPORT_PREFIX,
    encodeSupportValue,
    decodeSupportValue,
    encodeQueryValue,
    decodeQueryValue
  } = resourceFilter;

  loadFilterStyles();""",
    "mobile filter dependency",
)
mobile = replace_regex(
    mobile,
    r"\n  function installFilterMatchers\(\) \{.*?\n  function onReady\(callback\) \{",
    "\n  function onReady(callback) {",
    "prototype matcher removal",
)
mobile = replace_regex(
    mobile,
    r"\n  function encodeSupportValue\(values\) \{.*?\n  function supportLabel\(value\) \{",
    "\n  function supportLabel(value) {",
    "mobile codec duplication",
)
write("mobile.js", mobile)


# Use the same matcher for option counts so counts and displayed results cannot drift.
accordions = read("filter-accordions.js")
accordions = replace_once(
    accordions,
    "  const SUPPORT_PREFIX = '__rn_support__:';\n  const QUERY_PREFIX = '__rn_query__:';\n",
    """  const resourceFilter = window.ResourceFilter;
  if (!resourceFilter) {
    console.error('ResourceFilter must load before filter-accordions.js');
    return;
  }
  const { decodeSupportValue, decodeQueryValue, matchesResource } = resourceFilter;
""",
    "filter count dependency",
)
accordions = replace_regex(
    accordions,
    r"  function matchesFilters\(resource, filters\) \{.*?\n  function setOptionCount\(input, count\) \{",
    """  function matchesFilters(resource, filters) {
    return matchesResource(resource, filters);
  }

  function setOptionCount(input, count) {""",
    "filter count matcher",
)
accordions = replace_regex(
    accordions,
    r"\n  function decodeSupportValue\(value\) \{.*?\n  function tagList\(value\) \{",
    "\n  function tagList(value) {",
    "filter count codec duplication",
)
write("filter-accordions.js", accordions)


# Share support-selection decoding with the visual shortcut layer.
icons = read("filter-icons.js")
icons = replace_once(
    icons,
    "  const SUPPORT_PREFIX = '__rn_support__:';\n",
    """  const resourceFilter = window.ResourceFilter;
  if (!resourceFilter) {
    console.error('ResourceFilter must load before filter-icons.js');
    return;
  }
  const { SUPPORT_PREFIX, decodeSupportValue } = resourceFilter;
""",
    "filter icon dependency",
)
icons = replace_regex(
    icons,
    r"\n  function decodeSupportValue\(value\) \{.*?\n  function tagList\(value\) \{",
    "\n  function tagList(value) {",
    "filter icon codec duplication",
)
write("filter-icons.js", icons)


# Add a browser guard that proves native prototypes remain untouched.
smoke = read("tests/e2e/smoke.spec.js")
smoke = replace_once(
    smoke,
    "test('loads the home page and supports the primary directory journey', async ({ page }) => {",
    """test('keeps native collection matchers intact', async ({ page }) => {
  await page.goto('/#directory');
  await waitForApplication(page);

  const matcherState = await page.evaluate(() => ({
    filterLoaded: Boolean(window.ResourceFilter),
    arrayIncludesIsNative: /\\[native code\\]/.test(Array.prototype.includes.toString()),
    stringIncludesIsNative: /\\[native code\\]/.test(String.prototype.includes.toString())
  }));

  expect(matcherState).toEqual({
    filterLoaded: true,
    arrayIncludesIsNative: true,
    stringIncludesIsNative: true
  });
});

test('loads the home page and supports the primary directory journey', async ({ page }) => {""",
    "browser prototype guard",
)
write("tests/e2e/smoke.spec.js", smoke)


# Add unit-test commands.
package = json.loads(read("package.json"))
package["scripts"] = {
    "test:unit": "node --test tests/unit/*.test.js",
    "test:e2e": package["scripts"]["test:e2e"],
    "test:e2e:headed": package["scripts"]["test:e2e:headed"],
    "test": "npm run test:unit && npm run test:e2e",
}
write("package.json", json.dumps(package, indent=2) + "\n")


# Run the pure matcher tests as part of the fast validation job.
workflow = read(".github/workflows/validate-static-site.yml")
workflow = replace_once(
    workflow,
    "          node --check /tmp/phase1-runtime.js\n          node --check tests/e2e/smoke.spec.js\n\n      - name: Check JSON syntax",
    """          node --check /tmp/phase1-runtime.js
          node --check tests/e2e/smoke.spec.js
          node --check tests/unit/resource-filter.test.js

      - name: Run filter unit tests
        run: npm run test:unit

      - name: Check JSON syntax""",
    "unit test workflow",
)
write(".github/workflows/validate-static-site.yml", workflow)

print("Filter refactor applied successfully.")
