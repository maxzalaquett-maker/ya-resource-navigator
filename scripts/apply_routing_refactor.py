from __future__ import annotations

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


ROUTE_STATE = r"""(function (root, factory) {
  'use strict';

  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document && root.history && root.location) {
    const router = api.createBrowserRouter(root);
    router.ensureDefaultView('home');
    root.ResourceRoute = router;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';

  const KNOWN_VIEWS = Object.freeze([
    'home', 'directory', 'urgent', 'foster', 'needs', 'partners', 'about'
  ]);

  function normalizeView(value, fallback = 'home') {
    const requested = String(value || '').replace(/^#/, '');
    if (KNOWN_VIEWS.includes(requested)) return requested;
    return KNOWN_VIEWS.includes(fallback) ? fallback : 'home';
  }

  function toSearchParams(value) {
    if (value instanceof URLSearchParams) return new URLSearchParams(value);
    if (typeof value === 'string') return new URLSearchParams(value.replace(/^\?/, ''));
    const params = new URLSearchParams();
    Object.entries(value || {}).forEach(([key, entry]) => {
      if (entry === undefined || entry === null || entry === '') return;
      params.set(key, String(entry));
    });
    return params;
  }

  function parseLocation(locationLike, fallback = 'home') {
    const view = normalizeView(locationLike?.hash, fallback);
    return {
      view,
      params: new URLSearchParams(String(locationLike?.search || '').replace(/^\?/, ''))
    };
  }

  function buildUrl(locationLike, view, params) {
    const query = toSearchParams(params).toString();
    const pathname = locationLike?.pathname || '/';
    return `${pathname}${query ? `?${query}` : ''}#${normalizeView(view)}`;
  }

  function createBrowserRouter(win) {
    const listeners = new Set();
    let lastHref = String(win.location.href || '');
    let notificationQueued = false;

    function current() {
      return parseLocation(win.location);
    }

    function notify(source) {
      lastHref = String(win.location.href || '');
      const snapshot = current();
      listeners.forEach((listener) => listener(snapshot, { source }));
      return snapshot;
    }

    function scheduleBrowserNotification(source) {
      if (notificationQueued) return;
      notificationQueued = true;
      win.setTimeout(() => {
        notificationQueued = false;
        const href = String(win.location.href || '');
        if (href === lastHref) return;
        notify(source);
      }, 0);
    }

    function navigate(view, params, options = {}) {
      const target = buildUrl(win.location, view, params);
      const currentRelative = `${win.location.pathname}${win.location.search}${win.location.hash}`;
      const replace = Boolean(options.replace);

      if (target !== currentRelative) {
        const method = replace ? 'replaceState' : 'pushState';
        win.history[method]({ resourceNavigator: true, view: normalizeView(view) }, '', target);
      }

      if (options.notify !== false) return notify(replace ? 'replace' : 'navigate');
      lastHref = String(win.location.href || '');
      return current();
    }

    function ensureDefaultView(view = 'home') {
      if (win.location.hash) return current();
      return navigate(view, new URLSearchParams(), { replace: true, notify: false });
    }

    function subscribe(listener, options = {}) {
      listeners.add(listener);
      if (options.immediate) listener(current(), { source: 'subscribe' });
      return () => listeners.delete(listener);
    }

    win.addEventListener('popstate', () => scheduleBrowserNotification('popstate'));
    win.addEventListener('hashchange', () => scheduleBrowserNotification('hashchange'));

    return Object.freeze({
      KNOWN_VIEWS,
      current,
      navigate,
      replace(view, params, options = {}) {
        return navigate(view, params, { ...options, replace: true });
      },
      ensureDefaultView,
      subscribe
    });
  }

  return Object.freeze({
    KNOWN_VIEWS,
    normalizeView,
    toSearchParams,
    parseLocation,
    buildUrl,
    createBrowserRouter
  });
});
"""


ROUTE_TESTS = r"""'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const routeState = require('../../route-state.js');

function createFakeWindow(initial = 'https://example.test/#home') {
  const listeners = new Map();
  const location = {};
  const applyUrl = (value) => {
    const url = new URL(value, location.href || initial);
    location.href = url.href;
    location.pathname = url.pathname;
    location.search = url.search;
    location.hash = url.hash;
  };
  applyUrl(initial);

  const calls = [];
  const history = {
    state: null,
    pushState(state, title, url) {
      this.state = state;
      calls.push({ method: 'pushState', url });
      applyUrl(url);
    },
    replaceState(state, title, url) {
      this.state = state;
      calls.push({ method: 'replaceState', url });
      applyUrl(url);
    }
  };

  return {
    location,
    history,
    calls,
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    setTimeout(callback) {
      callback();
    }
  };
}

test('parses known views and query parameters', () => {
  const parsed = routeState.parseLocation({ search: '?support=Housing', hash: '#directory' });
  assert.equal(parsed.view, 'directory');
  assert.equal(parsed.params.get('support'), 'Housing');
  assert.equal(routeState.parseLocation({ search: '', hash: '#unknown' }).view, 'home');
});

test('builds stable view URLs without an origin', () => {
  assert.equal(
    routeState.buildUrl({ pathname: '/navigator' }, 'about', { q: 'housing', page: 2 }),
    '/navigator?q=housing&page=2#about'
  );
});

test('uses push for navigation and replace for in-place state updates', () => {
  const win = createFakeWindow();
  const nativePush = win.history.pushState;
  const nativeReplace = win.history.replaceState;
  const router = routeState.createBrowserRouter(win);

  router.navigate('directory', { support: 'Housing / homelessness' });
  router.replace('directory', { support: 'Housing / homelessness', page: 2 }, { notify: false });

  assert.equal(win.history.pushState, nativePush);
  assert.equal(win.history.replaceState, nativeReplace);
  assert.deepEqual(win.calls.map((call) => call.method), ['pushState', 'replaceState']);
  assert.equal(router.current().view, 'directory');
  assert.equal(router.current().params.get('page'), '2');
});

test('adds the default home route with replaceState', () => {
  const win = createFakeWindow('https://example.test/');
  const router = routeState.createBrowserRouter(win);
  router.ensureDefaultView('home');

  assert.deepEqual(win.calls, [{ method: 'replaceState', url: '/#home' }]);
  assert.equal(router.current().view, 'home');
});
"""


write('route-state.js', ROUTE_STATE)
write('tests/unit/route-state.test.js', ROUTE_TESTS)


index = read('index.html')
index = replace_once(
    index,
    '  <script src="/resource-filter.js" defer></script>\n  <script src="/mobile.js" defer></script>',
    '  <script src="/resource-filter.js" defer></script>\n  <script src="/route-state.js" defer></script>\n  <script src="/mobile.js" defer></script>',
    'route-state script order',
)
write('index.html', index)


app = read('app.js')
app = replace_once(
    app,
    "  const resourceFilter = window.ResourceFilter;\n  if (!resourceFilter) throw new Error('ResourceFilter must load before app.js');\n",
    "  const resourceFilter = window.ResourceFilter;\n  const routeState = window.ResourceRoute;\n  if (!resourceFilter) throw new Error('ResourceFilter must load before app.js');\n  if (!routeState) throw new Error('ResourceRoute must load before app.js');\n",
    'app route dependency',
)
app = replace_once(
    app,
    "    document.querySelectorAll('[data-view]').forEach((button) => {\n      button.addEventListener('click', () => setView(button.dataset.view));\n    });",
    "    document.querySelectorAll('[data-view]').forEach((button) => {\n      button.addEventListener('click', () => routeState.navigate(button.dataset.view, buildUrlParams()));\n    });",
    'app view navigation',
)
app = replace_regex(
    app,
    r"    window\.addEventListener\('hashchange', \(\) => \{.*?\n  function syncControls\(\) \{",
    """    routeState.subscribe(handleRouteChange);
  }

  function handleRouteChange(nextRoute, meta = {}) {
    if (nextRoute.view === 'home') return;
    readUrlState(nextRoute);
    if (!state.data) return;
    syncControls();
    setView(state.view, meta.source === 'navigate');
    renderDirectory();
  }

  function readUrlState(nextRoute = routeState.current()) {
    const params = nextRoute.params;
    const requestedView = nextRoute.view;
    if (validViews().includes(requestedView)) state.view = requestedView;
    state.query = params.get('q') || '';
    state.support = params.get('support') || params.get('focus') || params.get('category') || 'all';
    state.area = params.get('area') || 'all';
    state.foster = params.get('foster') || 'all';
    state.priority = params.get('priority') || 'all';
    state.savedOnly = params.get('saved') === '1';
    state.sort = params.get('sort') || 'recommended';
    state.page = Math.max(1, Number(params.get('page')) || 1);
    syncControls();
  }

  function syncControls() {""",
    'app route listeners and parsing',
)
app = replace_once(
    app,
    "  function setView(view, updateUrl = true) {\n    if (!validViews().includes(view)) view = 'directory';\n    state.view = view;\n\n    document.querySelectorAll('[data-view-panel]').forEach((panel) => {\n      const active = panel.dataset.viewPanel === view;\n      panel.hidden = !active;\n      panel.classList.toggle('is-active', active);\n    });\n\n    document.querySelectorAll('[data-view]').forEach((button) => {\n      const active = button.dataset.view === view;\n      button.classList.toggle('is-active', active);\n      button.setAttribute('aria-current', active ? 'page' : 'false');\n    });\n\n    if (updateUrl) updateUrlState();\n    window.scrollTo({ top: 0, behavior: 'smooth' });\n  }",
    "  function setView(view, scroll = true) {\n    if (!validViews().includes(view)) view = 'directory';\n    state.view = view;\n\n    document.querySelectorAll('[data-view-panel]').forEach((panel) => {\n      const active = panel.dataset.viewPanel === view;\n      panel.hidden = !active;\n      panel.classList.toggle('is-active', active);\n    });\n\n    document.querySelectorAll('[data-view]').forEach((button) => {\n      const active = button.dataset.view === view;\n      button.classList.toggle('is-active', active);\n      button.setAttribute('aria-current', active ? 'page' : 'false');\n    });\n\n    if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });\n  }",
    'app view renderer',
)
app = replace_regex(
    app,
    r"  function updateUrlState\(\) \{.*?\n  function copyCurrentLink\(\) \{",
    """  function buildUrlParams() {
    const params = new URLSearchParams();
    if (state.query) params.set('q', state.query);
    if (state.support !== 'all') params.set('support', state.support);
    if (state.area !== 'all') params.set('area', state.area);
    if (state.foster !== 'all') params.set('foster', state.foster);
    if (state.priority !== 'all') params.set('priority', state.priority);
    if (state.savedOnly) params.set('saved', '1');
    if (state.sort !== 'recommended') params.set('sort', state.sort);
    if (state.page > 1) params.set('page', String(state.page));
    return params;
  }

  function updateUrlState() {
    if (routeState.current().view === 'home') return;
    try {
      routeState.replace(state.view, buildUrlParams(), { notify: false });
    } catch {
      // Some local preview environments use an opaque origin. The app remains usable without URL persistence.
    }
  }

  function copyCurrentLink() {""",
    'app URL writer',
)
write('app.js', app)


homepage = read('homepage-routing.js')
homepage = replace_regex(
    homepage,
    r"  const nativeReplaceState = window\.history\.replaceState\.bind\(window\.history\);.*?\n  const onReady = \(callback\) => \{",
    """  const routeState = window.ResourceRoute;
  if (!routeState) {
    console.error('ResourceRoute must load before homepage-routing.js');
    return;
  }

  let homeMode = routeState.current().view === 'home';
  let syncing = false;

  const onReady = (callback) => {""",
    'homepage route dependency',
)
homepage = replace_once(
    homepage,
    "    home.addEventListener('click', (event) => {\n      const destination = event.target.closest('[data-home-destination]')?.dataset.homeDestination;\n      if (!destination) return;\n      leaveHome();\n      document.querySelector(`.nav-tab[data-view=\"${destination}\"]`)?.click();\n    });",
    "    home.addEventListener('click', (event) => {\n      const destination = event.target.closest('[data-home-destination]')?.dataset.homeDestination;\n      if (!destination) return;\n      event.preventDefault();\n      routeState.navigate(destination, new URLSearchParams());\n    });",
    'homepage destination navigation',
)
homepage = replace_once(
    homepage,
    "    home.querySelectorAll('.home-need-link').forEach((link) => {\n      link.addEventListener('click', () => { homeMode = false; });\n    });",
    "    home.querySelectorAll('.home-need-link').forEach((link) => {\n      link.addEventListener('click', (event) => {\n        event.preventDefault();\n        const destination = new URL(link.href, window.location.href);\n        routeState.navigate('directory', destination.searchParams);\n      });\n    });",
    'homepage need navigation',
)
homepage = replace_once(
    homepage,
    "    document.addEventListener('click', (event) => {\n      if (event.target.closest('.nav-tab[data-view], [data-plan-jump], [data-urgent-jump]')) leaveHome();\n    }, true);\n\n",
    '',
    'homepage global click routing',
)
homepage = replace_once(
    homepage,
    "  function showHome() {\n    homeMode = true;\n    nativeReplaceState(window.history.state, '', `${window.location.pathname}#home`);\n    enforceHome();\n    window.scrollTo({ top: 0, behavior: 'smooth' });\n  }",
    "  function showHome() {\n    routeState.navigate('home', new URLSearchParams());\n    window.scrollTo({ top: 0, behavior: 'smooth' });\n  }",
    'homepage showHome',
)
homepage = replace_once(
    homepage,
    "  function leaveHome() {\n    if (!homeMode) return;\n    homeMode = false;",
    "  function leaveHome() {\n    homeMode = false;",
    'homepage leaveHome guard',
)
homepage = replace_regex(
    homepage,
    r"  function installRouteListeners\(\) \{.*?\n  \}\n\n  onReady\(buildHome\);",
    """  function installRouteListeners() {
    routeState.subscribe((nextRoute) => {
      if (nextRoute.view === 'home') {
        homeMode = true;
        enforceHome();
      } else {
        leaveHome();
      }
    });
  }

  onReady(buildHome);""",
    'homepage route subscription',
)
write('homepage-routing.js', homepage)


smoke = read('tests/e2e/smoke.spec.js')
smoke = replace_once(
    smoke,
    "test('keeps native collection matchers intact', async ({ page }) => {",
    "test('keeps native platform methods intact', async ({ page }) => {",
    'native method test title',
)
smoke = replace_once(
    smoke,
    "    filterLoaded: Boolean(window.ResourceFilter),\n    arrayIncludesIsNative: /\\[native code\\]/.test(Array.prototype.includes.toString()),\n    stringIncludesIsNative: /\\[native code\\]/.test(String.prototype.includes.toString())",
    "    filterLoaded: Boolean(window.ResourceFilter),\n    routeLoaded: Boolean(window.ResourceRoute),\n    arrayIncludesIsNative: /\\[native code\\]/.test(Array.prototype.includes.toString()),\n    stringIncludesIsNative: /\\[native code\\]/.test(String.prototype.includes.toString()),\n    pushStateIsNative: /\\[native code\\]/.test(history.pushState.toString()),\n    replaceStateIsNative: /\\[native code\\]/.test(history.replaceState.toString())",
    'native method state',
)
smoke = replace_once(
    smoke,
    "    filterLoaded: true,\n    arrayIncludesIsNative: true,\n    stringIncludesIsNative: true",
    "    filterLoaded: true,\n    routeLoaded: true,\n    arrayIncludesIsNative: true,\n    stringIncludesIsNative: true,\n    pushStateIsNative: true,\n    replaceStateIsNative: true",
    'native method expectation',
)
route_test = r"""

test('uses browser history for view navigation while replacing filter state', async ({ page }) => {
  const pageErrors = capturePageErrors(page);
  await page.goto('/#home');
  await waitForApplication(page);
  await expect(page.locator('#view-home')).toBeVisible();

  await page.locator('.nav-tab[data-view="directory"]').click();
  await expect(page.locator('#view-directory')).toBeVisible();
  await expect(page).toHaveURL(/#directory$/);

  const search = page.locator('#search-input-visible');
  await search.fill('housing');
  await expect.poll(() => new URL(page.url()).searchParams.has('q')).toBe(true);

  await page.locator('.nav-tab[data-view="about"]').click();
  await expect(page.locator('#view-about')).toBeVisible();
  await expect(page).toHaveURL(/#about$/);

  await page.goBack();
  await expect(page.locator('#view-directory')).toBeVisible();
  await expect(search).toHaveValue('housing');

  await page.goBack();
  await expect(page.locator('#view-home')).toBeVisible();
  await expect(page).toHaveURL(/#home$/);

  await page.goForward();
  await expect(page.locator('#view-directory')).toBeVisible();
  await expect(page.locator('#search-input-visible')).toHaveValue('housing');

  expect(pageErrors).toEqual([]);
});
"""
smoke = replace_once(
    smoke,
    "\ntest('restores a directory filter from a shared URL'",
    route_test + "\ntest('restores a directory filter from a shared URL'",
    'history browser test insertion',
)
write('tests/e2e/smoke.spec.js', smoke)

print('Routing refactor applied successfully.')
