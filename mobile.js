(() => {
  'use strict';

  const MOBILE_BREAKPOINT = 760;
  const SUPPORT_PREFIX = '__rn_support__:';
  const QUERY_PREFIX = '__rn_query__:';
  const originalArrayIncludes = Array.prototype.includes;
  const originalStringIncludes = String.prototype.includes;

  loadFilterStyles();
  installFilterMatchers();

  function loadFilterStyles() {
    if (document.querySelector('link[href="/directory-filters.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/directory-filters.css';
    document.head.appendChild(link);
  }

  function installFilterMatchers() {
    if (window.__RN_FILTER_MATCHERS__) return;
    window.__RN_FILTER_MATCHERS__ = true;

    Array.prototype.includes = function (searchElement, fromIndex) {
      if (typeof searchElement === 'string' && searchElement.startsWith(SUPPORT_PREFIX)) {
        const selected = decodeSupportValue(searchElement);
        return selected.some((value) => originalArrayIncludes.call(this, value));
      }
      return originalArrayIncludes.call(this, searchElement, fromIndex);
    };

    String.prototype.includes = function (searchString, position) {
      if (typeof searchString === 'string' && searchString.startsWith(QUERY_PREFIX)) {
        const parsed = decodeQueryValue(searchString);
        const haystack = String(this);
        const textMatches = !parsed.text || originalStringIncludes.call(haystack, parsed.text);
        const urgentMatches = !parsed.urgent || matchesUrgentNeed(haystack);
        const charlotteMatches = !parsed.charlotte || !originalStringIncludes.call(haystack, 'surrounding communities');
        return textMatches && urgentMatches && charlotteMatches;
      }
      return originalStringIncludes.call(this, searchString, position);
    };
  }

  function matchesUrgentNeed(haystack) {
    const strongSignals = [
      'call 911',
      'call or text 988',
      '988',
      '24/7',
      '24 hours',
      'crisis line',
      'crisis hotline',
      'emergency shelter',
      'emergency food',
      'same day',
      'same-day',
      'tonight',
      'immediate danger',
      'overdose',
      'domestic violence',
      'sexual assault',
      'human trafficking',
      'coordinated entry',
      'shelter bed',
      'walk-in crisis',
      'urgent care'
    ];

    if (strongSignals.some((signal) => originalStringIncludes.call(haystack, signal))) return true;

    const urgentAreas = [
      'housing / homelessness',
      'food and basic needs',
      'mental health',
      'safety / domestic violence / trafficking',
      'substance-use recovery'
    ];
    const accessSignals = ['emergency', 'crisis', 'hotline', 'immediate', 'walk-in', 'shelter', 'same day'];

    return urgentAreas.some((area) => originalStringIncludes.call(haystack, area))
      && accessSignals.some((signal) => originalStringIncludes.call(haystack, signal))
      && !originalStringIncludes.call(haystack, 'not an emergency service');
  }

  function onReady(callback) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', callback, { once: true });
    else callback();
  }

  function init() {
    initMobileNavigation();
    initDirectoryStats();
    initMobileFilters();
    window.setTimeout(initAdvancedDirectoryFilters, 0);
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
      if (document.getElementById('search-input-visible')?.value.trim()) count += 1;
      else if (document.getElementById('search-input')?.value.trim() && !document.getElementById('urgent-filter-toggle')?.checked) count += 1;
      if (document.querySelector('.support-area-checkbox:checked')) count += 1;
      if (document.getElementById('foster-filter-toggle')?.checked) count += 1;
      if (document.getElementById('urgent-filter-toggle')?.checked) count += 1;
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

  function initAdvancedDirectoryFilters(attempt = 0) {
    if (document.documentElement.dataset.advancedFiltersReady === 'true') return;

    const panel = document.querySelector('#view-directory .filter-panel');
    const supportSelect = document.getElementById('support-filter');
    const areaSelect = document.getElementById('area-filter');
    const fosterSelect = document.getElementById('foster-filter');
    const prioritySelect = document.getElementById('priority-filter');
    const searchInput = document.getElementById('search-input');
    const clearButton = document.getElementById('clear-filters');

    if (!panel || !supportSelect || supportSelect.options.length < 2 || !fosterSelect || !searchInput) {
      if (attempt < 30) window.setTimeout(() => initAdvancedDirectoryFilters(attempt + 1), 100);
      return;
    }

    document.documentElement.dataset.advancedFiltersReady = 'true';

    const heading = panel.querySelector('.filter-heading h2');
    if (heading) heading.textContent = 'Narrow your results';

    const supportFromUrl = new URLSearchParams(window.location.search).get('support');
    if (supportFromUrl?.startsWith(SUPPORT_PREFIX) && ![...supportSelect.options].some((option) => option.value === supportFromUrl)) {
      const option = document.createElement('option');
      option.value = supportFromUrl;
      option.textContent = 'Selected support areas';
      option.hidden = true;
      supportSelect.appendChild(option);
      supportSelect.value = supportFromUrl;
    }

    const visibleSearch = createVisibleSearch(searchInput);
    const supportChecklist = createSupportChecklist(supportSelect);
    const toggleGroup = createToggleGroup(fosterSelect, searchInput, visibleSearch);

    supportSelect.closest('.field')?.classList.add('advanced-filter-source');
    areaSelect?.closest('.field')?.classList.add('advanced-filter-source');
    fosterSelect.closest('.field')?.classList.add('advanced-filter-source');
    prioritySelect?.closest('.field')?.classList.add('advanced-filter-source');

    const searchField = visibleSearch.closest('.field');
    searchField?.insertAdjacentElement('afterend', supportChecklist);
    supportChecklist.insertAdjacentElement('afterend', toggleGroup);

    if (areaSelect && areaSelect.value !== 'all') {
      areaSelect.value = 'all';
      areaSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (prioritySelect && prioritySelect.value !== 'all') {
      prioritySelect.value = 'all';
      prioritySelect.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const syncFromUnderlying = () => {
      const query = decodeQueryValue(searchInput.value);
      visibleSearch.value = query.text;
      const urgent = document.getElementById('urgent-filter-toggle');
      if (urgent) urgent.checked = query.urgent;

      const selected = decodeSupportValue(supportSelect.value);
      document.querySelectorAll('.support-area-checkbox').forEach((checkbox) => {
        checkbox.checked = selected.includes(checkbox.value);
      });

      const foster = document.getElementById('foster-filter-toggle');
      if (foster) foster.checked = fosterSelect.value === 'yes';

      rewriteActiveFilterLabels();
    };

    const restoreCharlotteScope = () => {
      syncFromUnderlying();
      syncUnderlyingQuery(searchInput, visibleSearch);
    };

    clearButton?.addEventListener('click', () => window.setTimeout(restoreCharlotteScope, 0));
    document.getElementById('active-filters')?.addEventListener('click', () => window.setTimeout(restoreCharlotteScope, 0));
    window.addEventListener('popstate', () => window.setTimeout(restoreCharlotteScope, 0));

    const activeFilters = document.getElementById('active-filters');
    if (activeFilters) {
      new MutationObserver(rewriteActiveFilterLabels).observe(activeFilters, { childList: true, subtree: true });
    }

    updateCharlotteCopy();
    window.setTimeout(updateCharlotteCopy, 500);
    window.setTimeout(updateCharlotteCopy, 1500);
    syncFromUnderlying();
    syncUnderlyingQuery(searchInput, visibleSearch);
  }

  function createVisibleSearch(original) {
    const existing = document.getElementById('search-input-visible');
    if (existing) return existing;

    const visible = original.cloneNode();
    visible.id = 'search-input-visible';
    visible.value = decodeQueryValue(original.value).text;
    visible.removeAttribute('aria-hidden');
    visible.removeAttribute('hidden');
    visible.placeholder = 'Try housing, jobs, food, counseling…';

    original.hidden = true;
    original.tabIndex = -1;
    original.setAttribute('aria-hidden', 'true');
    original.insertAdjacentElement('afterend', visible);

    visible.addEventListener('input', () => {
      syncUnderlyingQuery(original, visible);
    });

    return visible;
  }

  function createSupportChecklist(select) {
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'filter-checklist';
    fieldset.innerHTML = '<legend>What do you need help with?</legend>';

    const options = [...select.options]
      .filter((option) => option.value && option.value !== 'all' && !option.value.startsWith(SUPPORT_PREFIX));

    const selected = decodeSupportValue(select.value);
    const list = document.createElement('div');
    list.className = 'filter-checklist-options';

    options.forEach((option, index) => {
      const label = document.createElement('label');
      label.className = `filter-check-option${index >= 7 ? ' is-extra' : ''}`;
      label.innerHTML = `<input class="support-area-checkbox" type="checkbox" value="${escapeAttribute(option.value)}"><span>${escapeHtml(supportLabel(option.textContent))}</span>`;
      const input = label.querySelector('input');
      input.checked = selected.includes(option.value);
      input.addEventListener('change', () => syncSupportSelect(select));
      list.appendChild(label);
    });

    fieldset.appendChild(list);

    if (options.length > 7) {
      const more = document.createElement('button');
      more.type = 'button';
      more.className = 'filter-see-all';
      more.textContent = 'See all';
      more.setAttribute('aria-expanded', 'false');
      more.addEventListener('click', () => {
        const expanded = fieldset.classList.toggle('is-expanded');
        more.textContent = expanded ? 'Show less' : 'See all';
        more.setAttribute('aria-expanded', String(expanded));
      });
      fieldset.appendChild(more);
    }

    return fieldset;
  }

  function createToggleGroup(fosterSelect, originalSearch, visibleSearch) {
    const group = document.createElement('fieldset');
    group.className = 'filter-toggle-group';
    group.innerHTML = '<legend>Show only</legend>';

    const fosterLabel = document.createElement('label');
    fosterLabel.className = 'filter-check-option';
    fosterLabel.innerHTML = '<input id="foster-filter-toggle" type="checkbox"><span>Foster care specific</span>';
    const fosterInput = fosterLabel.querySelector('input');
    fosterInput.checked = fosterSelect.value === 'yes';
    fosterInput.addEventListener('change', () => {
      fosterSelect.value = fosterInput.checked ? 'yes' : 'all';
      fosterSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const urgentLabel = document.createElement('label');
    urgentLabel.className = 'filter-check-option';
    urgentLabel.innerHTML = '<input id="urgent-filter-toggle" type="checkbox"><span>Meets urgent needs</span>';
    const urgentInput = urgentLabel.querySelector('input');
    urgentInput.checked = decodeQueryValue(originalSearch.value).urgent;
    urgentInput.addEventListener('change', () => syncUnderlyingQuery(originalSearch, visibleSearch));

    group.append(fosterLabel, urgentLabel);

    const saved = document.getElementById('saved-filter')?.closest('.check-field');
    if (saved) {
      saved.classList.add('filter-check-option', 'filter-saved-option');
      const text = saved.querySelector('span');
      if (text) text.textContent = 'Saved in my plan';
      group.appendChild(saved);
    }

    const note = document.createElement('p');
    note.className = 'filter-toggle-note';
    note.textContent = 'Urgent results are based on listings that mention crisis, emergency, shelter, hotline, same-day or other immediate help. Call first because availability can change.';
    group.appendChild(note);

    return group;
  }

  function syncSupportSelect(select) {
    const selected = [...document.querySelectorAll('.support-area-checkbox:checked')].map((input) => input.value);
    const value = selected.length === 0
      ? 'all'
      : selected.length === 1
        ? selected[0]
        : encodeSupportValue(selected);

    if (![...select.options].some((option) => option.value === value)) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = `${selected.length} support areas`;
      option.hidden = true;
      select.appendChild(option);
    }

    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function syncUnderlyingQuery(original, visible) {
    const urgent = document.getElementById('urgent-filter-toggle')?.checked || false;
    const text = visible.value.trim();
    original.value = encodeQueryValue(text, urgent);
    original.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function rewriteActiveFilterLabels() {
    const container = document.getElementById('active-filters');
    if (!container) return;

    const support = container.querySelector('[data-clear-filter="support"]');
    if (support) {
      const selected = decodeSupportValue(document.getElementById('support-filter')?.value || 'all');
      support.textContent = `${selected.length === 1 ? supportLabel(selected[0]) : `${selected.length} support areas`} ×`;
    }

    const foster = container.querySelector('[data-clear-filter="foster"]');
    if (foster) foster.textContent = 'Foster care specific ×';

    const query = container.querySelector('[data-clear-filter="query"]');
    if (query) {
      const parsed = decodeQueryValue(document.getElementById('search-input')?.value || '');
      const parts = [];
      if (parsed.text) parts.push(`Search: ${parsed.text}`);
      if (parsed.urgent) parts.push('Meets urgent needs');
      if (parts.length) query.textContent = `${parts.join(' · ')} ×`;
      else query.remove();
    }
  }

  function updateCharlotteCopy() {
    const eyebrow = document.querySelector('#view-directory .hero .eyebrow');
    if (eyebrow) eyebrow.textContent = 'Help for young adults in Charlotte and Mecklenburg County';

    const aboutIntro = document.querySelector('#view-about .about-section:first-child p:first-of-type');
    if (aboutIntro) {
      aboutIntro.textContent = 'This directory is made for young adults looking for help in Charlotte and Mecklenburg County.';
    }

    const coverage = document.querySelector('#view-about .about-section:nth-child(2) p:nth-of-type(2)');
    if (coverage) {
      coverage.textContent = 'The directory focuses on programs based in Charlotte or Mecklenburg County, plus statewide programs that people in Charlotte can use. Programs based only in nearby communities are not shown for now.';
    }
  }

  function encodeSupportValue(values) {
    return `${SUPPORT_PREFIX}${values.map((value) => encodeURIComponent(value)).join('~')}`;
  }

  function decodeSupportValue(value) {
    const input = String(value || '');
    if (!input || input === 'all') return [];
    if (!input.startsWith(SUPPORT_PREFIX)) return [input];
    return input.slice(SUPPORT_PREFIX.length).split('~').map((item) => {
      try { return decodeURIComponent(item); } catch { return item; }
    }).filter(Boolean);
  }

  function encodeQueryValue(text, urgent) {
    const params = new URLSearchParams();
    params.set('scope', 'charlotte');
    params.set('urgent', urgent ? '1' : '0');
    if (text) params.set('text', text.toLowerCase());
    return `${QUERY_PREFIX}${params.toString()}`;
  }

  function decodeQueryValue(value) {
    const input = String(value || '');
    if (!input.startsWith(QUERY_PREFIX)) return { text: input, urgent: false, charlotte: false };
    const params = new URLSearchParams(input.slice(QUERY_PREFIX.length));
    return {
      text: params.get('text') || '',
      urgent: params.get('urgent') === '1',
      charlotte: params.get('scope') === 'charlotte'
    };
  }

  function supportLabel(value) {
    const labels = {
      'Housing / homelessness': 'Housing or a place to stay',
      'Food and basic needs': 'Food and basic needs',
      'Employment / workforce': 'Jobs and work',
      'Education': 'School and education',
      'Transportation': 'Transportation',
      'Primary health care': 'Doctors and healthcare',
      'Mental health': 'Mental health and counseling',
      'Substance-use recovery': 'Drug or alcohol recovery',
      'Benefits': 'Benefits and public assistance',
      'Financial capability': 'Money, budgeting and credit',
      'Documents / ID': 'IDs and important documents',
      'Legal': 'Legal help',
      'Parenting / child care': 'Parenting and child care',
      'Safety / domestic violence / trafficking': 'Safety and relationship violence',
      'Mentorship': 'Mentoring',
      'Community / belonging': 'Community and belonging',
      'Soft skills / life skills': 'Everyday and work skills'
    };
    return labels[value] || value;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replaceAll('`', '&#096;');
  }

  onReady(init);
})();