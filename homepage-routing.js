(() => {
  'use strict';

  const nativeReplaceState = window.history.replaceState.bind(window.history);
  let homeMode = !window.location.hash || window.location.hash === '#home';
  let syncing = false;

  if (!window.location.hash) {
    nativeReplaceState(window.history.state, '', `${window.location.pathname}#home`);
  }

  window.history.replaceState = function replaceState(state, title, url) {
    let nextUrl = url;
    if (homeMode && typeof nextUrl === 'string') {
      const parsed = new URL(nextUrl, window.location.href);
      parsed.hash = 'home';
      nextUrl = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    return nativeReplaceState(state, title, nextUrl);
  };

  const onReady = (callback) => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', callback, { once: true });
    else callback();
  };

  const icon = (path) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${path}"></path></svg>`;

  function buildHome() {
    if (document.getElementById('view-home')) return;

    const main = document.getElementById('main-content');
    const directory = document.getElementById('view-directory');
    const nav = document.querySelector('.view-nav .nav-scroll');
    if (!main || !directory || !nav) return;

    const homeTab = document.createElement('button');
    homeTab.type = 'button';
    homeTab.className = 'nav-tab home-nav-tab';
    homeTab.textContent = 'Home';
    homeTab.setAttribute('aria-current', 'false');
    nav.insertBefore(homeTab, nav.firstElementChild);

    const home = document.createElement('section');
    home.id = 'view-home';
    home.className = 'view home-view';
    home.innerHTML = `
      <div class="home-hero">
        <div class="shell home-hero-grid">
          <div>
            <p class="eyebrow">Charlotte young adult resource navigator</p>
            <h1>Find the right help in Charlotte</h1>
            <p class="home-hero-copy">Find trustworthy programs for housing, food, work, health, transportation, education, life after foster care and other practical needs.</p>
            <div class="home-actions">
              <button class="button button-primary" type="button" data-home-destination="directory">Browse all programs</button>
              <button class="button button-quiet" type="button" data-home-destination="urgent">I need help today</button>
            </div>
          </div>
          <aside class="home-audience-card">
            <strong>Use it yourself or help someone else.</strong>
            <p>Built for young adults, social workers, case managers, mentors, foster families, churches and community partners.</p>
          </aside>
        </div>
      </div>

      <section class="shell home-section" aria-labelledby="home-path-title">
        <div class="home-section-heading">
          <p class="eyebrow">Choose a starting point</p>
          <h2 id="home-path-title">How would you like to find help?</h2>
          <p>Start with the option that best matches what is happening right now.</p>
        </div>
        <div class="home-path-grid">
          <button class="home-path-card" type="button" data-home-destination="directory">
            <span class="home-path-icon">${icon('M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z')}</span>
            <span><strong>Browse programs</strong><small>Search and filter the full listing of Charlotte-area resources.</small></span><b aria-hidden="true">→</b>
          </button>
          <button class="home-path-card home-path-urgent" type="button" data-home-destination="urgent">
            <span class="home-path-icon">${icon('M12 3 2.8 20h18.4L12 3Zm-1 7v4h2v-4h-2Zm0 5.5v2h2v-2h-2Z')}</span>
            <span><strong>Urgent help</strong><small>Find help available today and decide who to call first.</small></span><b aria-hidden="true">→</b>
          </button>
          <button class="home-path-card" type="button" data-home-destination="foster">
            <span class="home-path-icon">${icon('M12 21s-8-4.6-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.4-8 11-8 11Zm0-2.4c2.2-1.4 6-4.7 6-8.6a2.5 2.5 0 0 0-4.6-1.3L12 10.9l-1.4-2.2A2.5 2.5 0 0 0 6 10c0 3.9 3.8 7.2 6 8.6Z')}</span>
            <span><strong>Post-foster care help</strong><small>Explore programs and benefits for young adults with foster-care experience.</small></span><b aria-hidden="true">→</b>
          </button>
        </div>
      </section>

      <section class="home-needs-section" aria-labelledby="home-needs-title">
        <div class="shell">
          <div class="home-section-heading">
            <p class="eyebrow">Browse by need</p>
            <h2 id="home-needs-title">What kind of help are you looking for?</h2>
            <p>Choose a category to open the directory with that filter selected.</p>
          </div>
          <div class="home-need-grid">
            ${needLink('Housing', 'Housing / homelessness', 'M3 11.2 12 4l9 7.2V21h-6v-6H9v6H3v-9.8Z')}
            ${needLink('Food & essentials', 'Food / essentials', 'M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M15 3v18M15 3c3.3 1.2 5 4 5 8h-5')}
            ${needLink('Jobs', 'Employment / workforce', 'M9 6V4h6v2M3 8h18v12H3V8Zm0 5h18M10 12v2h4v-2')}
            ${needLink('Education', 'Education', 'm2 9 10-5 10 5-10 5L2 9Zm4 3v5c3.5 2.5 8.5 2.5 12 0v-5')}
            ${needLink('Healthcare', 'Health care', 'M12 21C7 17.8 4 14.8 4 10.5A4.5 4.5 0 0 1 12 7.7a4.5 4.5 0 0 1 8 2.8C20 14.8 17 17.8 12 21Zm-1-11v3H8v2h3v3h2v-3h3v-2h-3v-3h-2Z')}
            ${needLink('Mental health & recovery', 'Mental health / recovery', 'M9.5 4A3.5 3.5 0 0 0 6 7.5v.7A3.5 3.5 0 0 0 4 11.4 3.6 3.6 0 0 0 6 14.7v.8A3.5 3.5 0 0 0 9.5 19H12V4H9.5ZM14 4v15h.5a3.5 3.5 0 0 0 3.5-3.5v-.8a3.6 3.6 0 0 0 2-3.3 3.5 3.5 0 0 0-2-3.2v-.7A3.5 3.5 0 0 0 14.5 4H14Z')}
            ${needLink('Transportation', 'Transportation', 'M5 4h14l2 8v7h-2v2h-3v-2H8v2H5v-2H3v-7l2-8Zm1.5 2-1.2 5h13.4l-1.2-5h-11Z')}
            ${needLink('Legal, identity & safety', 'Legal / identity / safety', 'M12 2 4 5v6c0 5.2 3.2 8 11 4.8-2.3 8-5.8 8-11V5l-8-3Zm0 2.2 6 2.2V11c0 3.9-2.1 6.7-6 8.7C8.1 17.7 6 14.9 6 11V6.4l6-2.2Z')}
          </div>
        </div>
      </section>`;

    main.insertBefore(home, directory);

    homeTab.addEventListener('click', showHome);
    home.addEventListener('click', (event) => {
      const destination = event.target.closest('[data-home-destination]')?.dataset.homeDestination;
      if (!destination) return;
      leaveHome();
      document.querySelector(`.nav-tab[data-view="${destination}"]`)?.click();
    });

    home.querySelectorAll('.home-need-link').forEach((link) => {
      link.addEventListener('click', () => { homeMode = false; });
    });

    const brand = document.querySelector('.brand');
    if (brand) {
      brand.href = '#home';
      brand.setAttribute('aria-label', 'Resource Navigator home');
      brand.addEventListener('click', (event) => {
        event.preventDefault();
        showHome();
      });
    }

    document.addEventListener('click', (event) => {
      if (event.target.closest('.nav-tab[data-view], [data-plan-jump], [data-urgent-jump]')) leaveHome();
    }, true);

    updateLabels();
    installRouteListeners();

    new MutationObserver(() => {
      if (homeMode) window.requestAnimationFrame(enforceHome);
    }).observe(main, { subtree: true, attributes: true, attributeFilter: ['hidden', 'class'] });

    if (homeMode) enforceHome();
    else home.hidden = true;
  }

  function needLink(label, support, path) {
    const href = `?support=${encodeURIComponent(support)}#directory`;
    return `<a class="home-need-link" href="${href}">${icon(path)}<span>${label}</span></a>`;
  }

  function updateLabels() {
    setText('.nav-tab[data-view="directory"]', 'Browse programs');
    setText('.nav-tab[data-view="urgent"]', 'Urgent help');
    setText('.nav-tab[data-view="foster"]', 'Post-foster care help');

    setText('#view-directory .hero .eyebrow', 'Charlotte-area program directory');
    setText('#view-directory .hero h1', 'Browse Charlotte-area programs');
    setText('#view-directory .hero-copy', 'Search and filter programs for housing, food, jobs, education, healthcare, mental health, transportation, legal needs, life skills, mentorship and more.');

    setText('#view-urgent .page-heading .eyebrow', 'Help right now');
    setText('#view-urgent .page-heading h1', 'Urgent help today');
    setText('#view-urgent .page-heading p:last-child', 'Get help deciding who to call first, then review organizations and resources that may be able to help today.');

    setText('#view-foster .page-heading .eyebrow', 'Support after foster care');
    setText('#view-foster .page-heading h1', 'Post-foster care help');
    setText('#view-foster .page-heading p:last-child', 'Find programs and time-sensitive benefits for young adults with foster-care experience, including housing, healthcare, education and independent-living support.');

    setText('#view-about .page-heading h1', 'About the Resource Navigator');
  }

  function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  }

  function showHome() {
    homeMode = true;
    nativeReplaceState(window.history.state, '', `${window.location.pathname}#home`);
    enforceHome();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function leaveHome() {
    if (!homeMode) return;
    homeMode = false;
    const home = document.getElementById('view-home');
    const tab = document.querySelector('.home-nav-tab');
    if (home) {
      home.hidden = true;
      home.classList.remove('is-active');
    }
    tab?.classList.remove('is-active');
    tab?.setAttribute('aria-current', 'false');
  }

  function enforceHome() {
    if (!homeMode || syncing) return;
    syncing = true;
    const home = document.getElementById('view-home');
    document.querySelectorAll('[data-view-panel]').forEach((panel) => {
      if (!panel.hidden) panel.hidden = true;
      panel.classList.remove('is-active');
    });
    document.querySelectorAll('.nav-tab').forEach((tab) => {
      tab.classList.remove('is-active');
      tab.setAttribute('aria-current', 'false');
    });
    if (home) {
      home.hidden = false;
      home.classList.add('is-active');
    }
    const tab = document.querySelector('.home-nav-tab');
    tab?.classList.add('is-active');
    tab?.setAttribute('aria-current', 'page');
    const mobileLabel = document.querySelector('.mobile-nav-current');
    if (mobileLabel) mobileLabel.textContent = 'Home';
    syncing = false;
  }

  function installRouteListeners() {
    const syncRoute = () => {
      if (window.location.hash === '#home' || !window.location.hash) {
        homeMode = true;
        enforceHome();
      } else {
        leaveHome();
      }
    };
    window.addEventListener('hashchange', () => window.setTimeout(syncRoute, 0));
    window.addEventListener('popstate', () => window.setTimeout(syncRoute, 0));
  }

  onReady(buildHome);
})();
