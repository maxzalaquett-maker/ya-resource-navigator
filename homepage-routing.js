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

  // Official Bootstrap Icons SVG geometry, licensed under the MIT License.
  // Source: https://github.com/twbs/icons
  const BOOTSTRAP_ICONS = {
    grid: '<path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zm6.5.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5z"/>',
    'exclamation-triangle': '<path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.15.15 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.2.2 0 0 1-.054.06.1.1 0 0 1-.066.017H1.146a.1.1 0 0 1-.066-.017.2.2 0 0 1-.054-.06.18.18 0 0 1 .002-.183L7.884 2.073a.15.15 0 0 1 .054-.057m1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767z"/><path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>',
    heart: '<path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143q.09.083.176.171a3 3 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15"/>',
    'house-door': '<path d="M8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 0 .5-.5v-4h2v4a.5.5 0 0 0 .5.5H14a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293zM2.5 14V7.707l5.5-5.5 5.5 5.5V14H10v-4a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5v4z"/>',
    basket2: '<path d="M4 10a1 1 0 0 1 2 0v2a1 1 0 0 1-2 0zm3 0a1 1 0 0 1 2 0v2a1 1 0 0 1-2 0zm3 0a1 1 0 1 1 2 0v2a1 1 0 0 1-2 0z"/><path d="M5.757 1.071a.5.5 0 0 1 .172.686L3.383 6h9.234L10.07 1.757a.5.5 0 1 1 .858-.514L13.783 6H15.5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-.623l-1.844 6.456a.75.75 0 0 1-.722.544H3.69a.75.75 0 0 1-.722-.544L1.123 8H.5a.5.5 0 0 1-.5-.5v-1A.5.5 0 0 1 .5 6h1.717L5.07 1.243a.5.5 0 0 1 .686-.172zM2.163 8l1.714 6h8.246l1.714-6z"/>',
    briefcase: '<path d="M6.5 1A1.5 1.5 0 0 0 5 2.5V3H1.5A1.5 1.5 0 0 0 0 4.5v8A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 14.5 3H11v-.5A1.5 1.5 0 0 0 9.5 1zm0 1h3a.5.5 0 0 1 .5.5V3H6v-.5a.5.5 0 0 1 .5-.5m1.886 6.914L15 7.151V12.5a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5V7.15l6.614 1.764a1.5 1.5 0 0 0 .772 0M1.5 4h13a.5.5 0 0 1 .5.5v1.616L8.129 7.948a.5.5 0 0 1-.258 0L1 6.116V4.5a.5.5 0 0 1 .5-.5"/>',
    mortarboard: '<path d="M8.211 2.047a.5.5 0 0 0-.422 0l-7.5 3.5a.5.5 0 0 0 .025.917l7.5 3a.5.5 0 0 0 .372 0L14 7.14V13a1 1 0 0 0-1 1v2h3v-2a1 1 0 0 0-1-1V6.739l.686-.275a.5.5 0 0 0 .025-.917zM8 8.46 1.758 5.965 8 3.052l6.242 2.913z"/><path d="M4.176 9.032a.5.5 0 0 0-.656.327l-.5 1.7a.5.5 0 0 0 .294.605l4.5 1.8a.5.5 0 0 0 .372 0l4.5-1.8a.5.5 0 0 0 .294-.605l-.5-1.7a.5.5 0 0 0-.656-.327L8 10.466zm-.068 1.873.22-.748 3.496 1.311a.5.5 0 0 0 .352 0l3.496-1.311.22.748L8 12.46z"/>',
    'heart-pulse': '<path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053.918 3.995.78 5.323 1.508 7H.43c-2.128-5.697 4.165-8.83 7.394-5.857q.09.083.176.171a3 3 0 0 1 .176-.17c3.23-2.974 9.522.159 7.394 5.856h-1.078c.728-1.677.59-3.005.108-3.947C13.486.878 10.4.28 8.717 2.01zM2.212 10h1.315C4.593 11.183 6.05 12.458 8 13.795c1.949-1.337 3.407-2.612 4.473-3.795h1.315c-1.265 1.566-3.14 3.25-5.788 5-2.648-1.75-4.523-3.434-5.788-5"/><path d="M10.464 3.314a.5.5 0 0 0-.945.049L7.921 8.956 6.464 5.314a.5.5 0 0 0-.88-.091L3.732 8H.5a.5.5 0 0 0 0 1H4a.5.5 0 0 0 .416-.223l1.473-2.209 1.647 4.118a.5.5 0 0 0 .945-.049l1.598-5.593 1.457 3.642A.5.5 0 0 0 12 9h3.5a.5.5 0 0 0 0-1h-3.162z"/>',
    'emoji-smile': '<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/><path d="M4.285 9.567a.5.5 0 0 1 .683.183A3.5 3.5 0 0 0 8 11.5a3.5 3.5 0 0 0 3.032-1.75.5.5 0 1 1 .866.5A4.5 4.5 0 0 1 8 12.5a4.5 4.5 0 0 1-3.898-2.25.5.5 0 0 1 .183-.683M7 6.5C7 7.328 6.552 8 6 8s-1-.672-1-1.5S5.448 5 6 5s1 .672 1 1.5m4 0c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S9.448 5 10 5s1 .672 1 1.5"/>',
    'bus-front': '<path d="M5 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0m8 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-6-1a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2zm1-6c-1.876 0-3.426.109-4.552.226A.5.5 0 0 0 3 4.723v3.554a.5.5 0 0 0 .448.497C4.574 8.891 6.124 9 8 9s3.426-.109 4.552-.226A.5.5 0 0 0 13 8.277V4.723a.5.5 0 0 0-.448-.497A44 44 0 0 0 8 4m0-1c-1.837 0-3.353.107-4.448.22a.5.5 0 1 1-.104-.994A44 44 0 0 1 8 2c1.876 0 3.426.109 4.552.226a.5.5 0 1 1-.104.994A43 43 0 0 0 8 3"/><path d="M15 8a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1V2.64c0-1.188-.845-2.232-2.064-2.372A44 44 0 0 0 8 0C5.9 0 4.208.136 3.064.268 1.845.408 1 1.452 1 2.64V4a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1v3.5c0 .818.393 1.544 1 2v2a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5V14h6v1.5a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5v-2c.607-.456 1-1.182 1-2zM8 1c2.056 0 3.71.134 4.822.261.676.078 1.178.66 1.178 1.379v8.86a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 11.5V2.64c0-.72.502-1.301 1.178-1.379A43 43 0 0 1 8 1"/>',
    'shield-check': '<path d="M5.338 1.59a61 61 0 0 0-2.837.856.48.48 0 0 0-.328.39c-.554 4.157.726 7.19 2.253 9.188a10.7 10.7 0 0 0 2.287 2.233c.346.244.652.42.893.533q.18.085.293.118a1 1 0 0 0 .101.025 1 1 0 0 0 .1-.025q.114-.034.294-.118c.24-.113.547-.29.893-.533a10.7 10.7 0 0 0 2.287-2.233c1.527-1.997 2.807-5.031 2.253-9.188a.48.48 0 0 0-.328-.39c-.651-.213-1.75-.56-2.837-.855C9.552 1.29 8.531 1.067 8 1.067c-.53 0-1.552.223-2.662.524zM5.072.56C6.157.265 7.31 0 8 0s1.843.265 2.928.56c1.11.3 2.229.655 2.887.87a1.54 1.54 0 0 1 1.044 1.262c.596 4.477-.787 7.795-2.465 9.99a11.8 11.8 0 0 1-2.517 2.453 7 7 0 0 1-1.048.625c-.28.132-.581.24-.829.24s-.548-.108-.829-.24a7 7 0 0 1-1.048-.625 11.8 11.8 0 0 1-2.517-2.453C1.928 10.487.545 7.169 1.141 2.692A1.54 1.54 0 0 1 2.185 1.43 63 63 0 0 1 5.072.56"/><path d="M10.854 5.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 7.793l2.646-2.647a.5.5 0 0 1 .708 0"/>',
    'arrow-right': '<path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"/>'
  };

  function bootstrapIcon(name) {
    const paths = BOOTSTRAP_ICONS[name];
    if (!paths) return '';
    return `<svg xmlns="http://www.w3.org/2000/svg" class="bi bi-${name}" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false">${paths}</svg>`;
  }

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
            <span class="home-path-icon">${bootstrapIcon('grid')}</span>
            <span><strong>Browse programs</strong><small>Search and filter the full listing of Charlotte-area resources.</small></span>
            <span class="home-path-arrow">${bootstrapIcon('arrow-right')}</span>
          </button>
          <button class="home-path-card home-path-urgent" type="button" data-home-destination="urgent">
            <span class="home-path-icon">${bootstrapIcon('exclamation-triangle')}</span>
            <span><strong>Urgent help</strong><small>Find help available today and decide who to call first.</small></span>
            <span class="home-path-arrow">${bootstrapIcon('arrow-right')}</span>
          </button>
          <button class="home-path-card" type="button" data-home-destination="foster">
            <span class="home-path-icon">${bootstrapIcon('heart')}</span>
            <span><strong>Post-foster care help</strong><small>Explore programs and benefits for young adults with foster-care experience.</small></span>
            <span class="home-path-arrow">${bootstrapIcon('arrow-right')}</span>
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
            ${needLink('Housing', 'Housing / homelessness', 'house-door')}
            ${needLink('Food & essentials', 'Food / essentials', 'basket2')}
            ${needLink('Jobs', 'Employment / workforce', 'briefcase')}
            ${needLink('Education', 'Education', 'mortarboard')}
            ${needLink('Healthcare', 'Health care', 'heart-pulse')}
            ${needLink('Mental health & recovery', 'Mental health / recovery', 'emoji-smile')}
            ${needLink('Transportation', 'Transportation', 'bus-front')}
            ${needLink('Legal, identity & safety', 'Legal / identity / safety', 'shield-check')}
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

  function needLink(label, support, iconName) {
    const href = `?support=${encodeURIComponent(support)}#directory`;
    return `<a class="home-need-link" href="${href}">${bootstrapIcon(iconName)}<span>${label}</span></a>`;
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
