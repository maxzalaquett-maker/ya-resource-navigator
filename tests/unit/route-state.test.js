'use strict';

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
