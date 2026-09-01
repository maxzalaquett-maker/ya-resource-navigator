(function (root, factory) {
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
