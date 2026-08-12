(() => {
  'use strict';

  const MOBILE_BREAKPOINT = 760;

  function onReady(callback) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', callback, { once: true });
    else callback();
  }

  function init() {
    initMobileNavigation();
    initDirectoryStats();
    initMobileFilters();
  }

  function initMobileNavigation() {
    const nav = document.querySelector('.view-nav');
    const menu = nav?.querySelector('.nav-scroll');
    if (!nav || !menu || document.getElementById('mobile-nav-toggle')) return;

    menu.id = menu.id || 'view-nav-menu';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.id = 'mobile-nav-toggle';
    toggle.className = 'mobile-nav-toggle';
    toggle.setAttribute('aria-controls', menu.id);
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = `
      <span class="mobile-nav-current">Directory</span>
      <span class="mobile-nav-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16"></path>
        </svg>
      </span>`;

    nav.insertBefore(toggle, menu);

    const currentLabel = toggle.querySelector('.mobile-nav-current');
    const navTabs = [...menu.querySelectorAll('.nav-tab')];

    const syncCurrentLabel = () => {
      const active = navTabs.find((tab) => tab.classList.contains('is-active'));
      if (active) currentLabel.textContent = active.textContent.trim();
    };

    const setOpen = (open) => {
      nav.classList.toggle('mobile-nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close section menu' : 'Open section menu');
    };

    toggle.addEventListener('click', () => {
      setOpen(!nav.classList.contains('mobile-nav-open'));
    });

    menu.addEventListener('click', (event) => {
      const tab = event.target.closest('.nav-tab');
      if (!tab) return;
      currentLabel.textContent = tab.textContent.trim();
      if (window.innerWidth <= MOBILE_BREAKPOINT) setOpen(false);
    });

    document.addEventListener('click', (event) => {
      if (window.innerWidth > MOBILE_BREAKPOINT || !nav.classList.contains('mobile-nav-open')) return;
      if (!nav.contains(event.target)) setOpen(false);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > MOBILE_BREAKPOINT) setOpen(false);
    });

    new MutationObserver(syncCurrentLabel).observe(menu, {
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    syncCurrentLabel();
    setOpen(false);
  }

  function initDirectoryStats() {
    const directory = document.getElementById('view-directory');
    const stats = directory?.querySelector('.stats-grid');
    const heroCopy = directory?.querySelector('.hero-directory .hero-copy');
    if (!directory || !stats || !heroCopy || stats.classList.contains('stats-in-hero')) return;

    heroCopy.insertAdjacentElement('afterend', stats);
    stats.classList.add('stats-in-hero');
  }

  function initMobileFilters() {
    const directory = document.getElementById('view-directory');
    const layout = directory?.querySelector('.directory-layout');
    const panel = directory?.querySelector('.filter-panel');
    const directoryMain = directory?.querySelector('.directory-main');
    const toolbar = directory?.querySelector('.results-toolbar');
    const sortField = toolbar?.querySelector('.sort-field');
    if (!directory || !layout || !panel || !directoryMain || !toolbar || !sortField || document.getElementById('mobile-filter-toggle')) return;

    panel.id = panel.id || 'directory-filters';

    const panelMarker = document.createComment('directory-filters-original-position');
    panel.parentNode.insertBefore(panelMarker, panel);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.id = 'mobile-filter-toggle';
    toggle.className = 'mobile-filter-toggle';
    toggle.setAttribute('aria-controls', panel.id);
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = `
      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        <path d="M4 5h16l-6.2 7.1v5.2l-3.6 1.8v-7L4 5z"></path>
      </svg>
      <span class="mobile-filter-label">Filter resources</span>
      <span class="mobile-filter-badge" aria-hidden="true" hidden></span>`;

    toolbar.insertBefore(toggle, sortField);

    const heading = panel.querySelector('.filter-heading');
    let closeButton;
    if (heading) {
      closeButton = document.createElement('button');
      closeButton.type = 'button';
      closeButton.className = 'mobile-filter-close';
      closeButton.setAttribute('aria-label', 'Close filters');
      closeButton.innerHTML = '<span aria-hidden="true">×</span>';
      heading.appendChild(closeButton);
    }

    const setOpen = (open) => {
      panel.classList.toggle('mobile-filter-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Hide directory filters' : 'Show directory filters');
    };

    const syncPanelPlacement = () => {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT;

      if (mobile) {
        if (panel.parentNode !== directoryMain || panel.previousElementSibling !== toolbar) {
          toolbar.insertAdjacentElement('afterend', panel);
        }
      } else if (panel.parentNode !== panelMarker.parentNode || panel.previousSibling !== panelMarker) {
        panelMarker.parentNode.insertBefore(panel, panelMarker.nextSibling);
      }
    };

    const activeFilterCount = () => {
      let count = 0;
      if (document.getElementById('search-input')?.value.trim()) count += 1;
      if ((document.getElementById('support-filter')?.value || 'all') !== 'all') count += 1;
      if ((document.getElementById('area-filter')?.value || 'all') !== 'all') count += 1;
      if ((document.getElementById('foster-filter')?.value || 'all') !== 'all') count += 1;
      if ((document.getElementById('priority-filter')?.value || 'all') !== 'all') count += 1;
      if (document.getElementById('saved-filter')?.checked) count += 1;
      return count;
    };

    const syncBadge = () => {
      const count = activeFilterCount();
      const badge = toggle.querySelector('.mobile-filter-badge');
      if (!badge) return;
      badge.hidden = count === 0;
      badge.textContent = count ? String(count) : '';
      toggle.setAttribute('aria-label', `${panel.classList.contains('mobile-filter-open') ? 'Hide' : 'Show'} directory filters${count ? `, ${count} active` : ''}`);
    };

    toggle.addEventListener('click', () => {
      const opening = !panel.classList.contains('mobile-filter-open');
      setOpen(opening);
      if (opening) {
        window.requestAnimationFrame(() => panel.querySelector('input, select, button')?.focus({ preventScroll: true }));
      }
    });

    closeButton?.addEventListener('click', () => {
      setOpen(false);
      toggle.focus({ preventScroll: true });
    });

    panel.addEventListener('input', syncBadge);
    panel.addEventListener('change', syncBadge);
    panel.addEventListener('click', (event) => {
      if (event.target.closest('#clear-filters')) window.setTimeout(syncBadge, 0);
    });

    window.addEventListener('popstate', () => window.setTimeout(syncBadge, 0));
    window.addEventListener('resize', () => {
      if (window.innerWidth > MOBILE_BREAKPOINT) setOpen(false);
      syncPanelPlacement();
    });

    syncPanelPlacement();
    setOpen(false);
    syncBadge();
    window.setTimeout(syncBadge, 0);
  }

  onReady(init);
})();
