(() => {
  'use strict';

  const SUPPORT_PREFIX = '__rn_support__:';
  const SHORTCUTS = [
    { value: 'Housing / homelessness', label: 'Housing', icon: 'house' },
    { value: 'Food / essentials', label: 'Food', icon: 'utensils' },
    { value: 'Employment / workforce', label: 'Jobs', icon: 'briefcase' },
    { value: 'Education', label: 'School', icon: 'graduation' },
    { value: 'Health care', label: 'Health', icon: 'health' },
    { value: 'Mental health / recovery', label: 'Mental health', icon: 'brain' },
    { value: 'Transportation', label: 'Transit', icon: 'bus' },
    { value: 'Legal / identity / safety', label: 'Legal', icon: 'shield' },
    { value: 'Mentorship', label: 'Mentors', icon: 'users' },
    { value: 'Benefits / financial assistance', label: 'Benefits', icon: 'wallet' }
  ];

  let resources = [];
  let updateQueued = false;
  let panelObserver;
  let chipObserver;

  function onReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  }

  function init(attempt = 0) {
    const panel = document.querySelector('#view-directory .filter-panel');
    const search = document.getElementById('search-input');
    const support = document.getElementById('support-filter');

    if (!panel || !search || !support) {
      if (attempt < 60) window.setTimeout(() => init(attempt + 1), 100);
      return;
    }

    renderShortcuts(panel, search);
    decorateFilterLabels();
    decorateFilterChips();
    bindUpdates(panel);
    observeEnhancements(panel);

    fetch('/data/app-data.json', { cache: 'no-cache' })
      .then((response) => {
        if (!response.ok) throw new Error(`Resource data returned ${response.status}`);
        return response.json();
      })
      .then((data) => {
        resources = Array.isArray(data?.resources) ? data.resources : [];
        updateShortcutCounts();
        syncShortcutSelection();
      })
      .catch((error) => {
        console.error('Visual filter shortcuts could not load counts:', error);
      });
  }

  function renderShortcuts(panel, search) {
    if (document.getElementById('filter-shortcuts')) return;

    const section = document.createElement('section');
    section.id = 'filter-shortcuts';
    section.className = 'filter-shortcuts';
    section.setAttribute('aria-labelledby', 'filter-shortcuts-title');
    section.innerHTML = `
      <div class="filter-shortcuts-heading">
        <div>
          <strong id="filter-shortcuts-title">Common needs</strong>
          <p>Choose one for a quick start. Use the filters below for more options.</p>
        </div>
      </div>
      <div class="filter-shortcut-grid">
        ${SHORTCUTS.map((item) => `
          <button class="filter-shortcut" type="button" data-filter-shortcut="${escapeAttribute(item.value)}" aria-pressed="false" title="Show ${escapeAttribute(item.label.toLowerCase())} programs">
            ${iconSvg(item.icon, 'filter-shortcut-icon')}
            <span class="filter-shortcut-label">${escapeHtml(item.label)}</span>
            <span class="filter-shortcut-count" data-filter-shortcut-count="${escapeAttribute(item.value)}" aria-hidden="true">—</span>
          </button>`).join('')}
      </div>`;

    section.addEventListener('click', handleShortcutClick);
    const searchField = search.closest('.field, label');
    if (searchField?.parentNode === panel) searchField.insertAdjacentElement('afterend', section);
    else panel.querySelector('.filter-heading')?.insertAdjacentElement('afterend', section);
  }

  function handleShortcutClick(event) {
    const button = event.target.closest('[data-filter-shortcut]');
    if (!button) return;
    applySupportShortcut(button.dataset.filterShortcut);
  }

  function applySupportShortcut(value) {
    const checkboxes = [...document.querySelectorAll('.support-area-checkbox')];
    const target = checkboxes.find((input) => input.value === value);

    if (target) {
      const selected = checkboxes.filter((input) => input.checked);
      const clearSelection = target.checked && selected.length === 1;
      checkboxes.forEach((input) => { input.checked = false; });
      if (!clearSelection) target.checked = true;
      target.dispatchEvent(new Event('change', { bubbles: true }));
      queueUpdate();
      return;
    }

    const select = document.getElementById('support-filter');
    if (!select) return;
    const activeValues = decodeSupportValue(select.value);
    const clearSelection = activeValues.length === 1 && activeValues[0] === value;
    if (clearSelection) {
      select.value = 'all';
    } else if ([...select.options].some((option) => option.value === value)) {
      select.value = value;
    } else {
      return;
    }
    select.dispatchEvent(new Event('change', { bubbles: true }));
    queueUpdate();
  }

  function bindUpdates(panel) {
    if (panel.dataset.filterIconEvents === 'true') return;
    panel.dataset.filterIconEvents = 'true';

    panel.addEventListener('input', queueUpdate);
    panel.addEventListener('change', queueUpdate);
    window.addEventListener('popstate', () => window.setTimeout(queueUpdate, 0));

    document.addEventListener('click', (event) => {
      if (event.target.closest('#clear-filters, [data-clear-filter]')) {
        window.setTimeout(queueUpdate, 0);
      }
    });
  }

  function observeEnhancements(panel) {
    if (!panelObserver) {
      panelObserver = new MutationObserver(queueUpdate);
      panelObserver.observe(panel, { childList: true, subtree: true });
    }

    const activeFilters = document.getElementById('active-filters');
    if (activeFilters && !chipObserver) {
      chipObserver = new MutationObserver(() => {
        decorateFilterChips();
        syncShortcutSelection();
      });
      chipObserver.observe(activeFilters, { childList: true, subtree: true, characterData: true });
    }
  }

  function queueUpdate() {
    if (updateQueued) return;
    updateQueued = true;
    window.requestAnimationFrame(() => {
      updateQueued = false;
      decorateFilterLabels();
      decorateFilterChips();
      syncShortcutSelection();
    });
  }

  function updateShortcutCounts() {
    SHORTCUTS.forEach((item) => {
      const count = resources.reduce((total, resource) => total + (tagList(resource.supportAreas).includes(item.value) ? 1 : 0), 0);
      const countElement = document.querySelector(`[data-filter-shortcut-count="${cssEscape(item.value)}"]`);
      if (!countElement) return;
      countElement.textContent = `${count}`;
      countElement.setAttribute('aria-hidden', 'false');
      const button = countElement.closest('[data-filter-shortcut]');
      button?.setAttribute('aria-label', `${item.label}, ${count} program${count === 1 ? '' : 's'}`);
    });
  }

  function syncShortcutSelection() {
    const selected = readSelectedSupportAreas();
    document.querySelectorAll('[data-filter-shortcut]').forEach((button) => {
      const active = selected.includes(button.dataset.filterShortcut);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function readSelectedSupportAreas() {
    const checkboxes = [...document.querySelectorAll('.support-area-checkbox')];
    if (checkboxes.length) return checkboxes.filter((input) => input.checked).map((input) => input.value);
    return decodeSupportValue(document.getElementById('support-filter')?.value || 'all');
  }

  function decorateFilterLabels() {
    decorateControlLabel('search-input', 'search');
    decorateControlLabel('area-filter', 'map-pin');
    decorateControlLabel('foster-filter', 'heart');
    decorateControlLabel('priority-filter', 'flag');
    decorateControlLabel('saved-filter', 'bookmark');

    const supportToggle = findGroupTitle('.filter-checklist', 'support-filter');
    decorateTextElement(supportToggle, 'grid');

    const additionalToggle = findGroupTitle('.filter-toggle-group');
    decorateTextElement(additionalToggle, 'sliders');
  }

  function decorateControlLabel(controlId, iconName) {
    const control = document.getElementById(controlId);
    if (!control) return;
    const container = control.closest('label, .field, .check-field, .filter-check-option');
    let label = container?.querySelector(':scope > span');
    if (!label && controlId === 'saved-filter') label = control.nextElementSibling;
    decorateTextElement(label, iconName);
  }

  function findGroupTitle(groupSelector, controlId = '') {
    const group = document.querySelector(`#view-directory .filter-panel ${groupSelector}`);
    if (group) {
      return group.querySelector(':scope > legend .filter-accordion-toggle > span, :scope > legend > span, :scope > legend');
    }
    if (!controlId) return null;
    const control = document.getElementById(controlId);
    return control?.closest('label, .field')?.querySelector(':scope > span') || null;
  }

  function decorateTextElement(element, iconName) {
    if (!element || element.dataset.filterLabelIcon === iconName) return;
    const existing = element.querySelector(':scope > .filter-label-icon');
    if (existing) existing.remove();
    element.classList.add('filter-label-with-icon');
    element.insertAdjacentHTML('afterbegin', iconSvg(iconName, 'filter-label-icon'));
    element.dataset.filterLabelIcon = iconName;
  }

  function decorateFilterChips() {
    document.querySelectorAll('#active-filters .filter-chip').forEach((chip) => {
      const key = chip.dataset.clearFilter || '';
      const label = chip.textContent.replace(/\s*×\s*$/, '').trim();
      const iconName = chipIcon(key, label);
      const existing = chip.querySelector(':scope > .filter-chip-icon');
      if (existing?.dataset.iconName === iconName) return;
      existing?.remove();
      const holder = document.createElement('span');
      holder.innerHTML = iconSvg(iconName, 'filter-chip-icon');
      const icon = holder.firstElementChild;
      icon.dataset.iconName = iconName;
      chip.prepend(icon);
    });
  }

  function chipIcon(key, label) {
    if (key === 'query') return 'search';
    if (key === 'area') return 'map-pin';
    if (key === 'foster') return 'heart';
    if (key === 'priority') return 'flag';
    if (key === 'savedOnly') return 'bookmark';
    if (key === 'support') return supportIconForLabel(label);
    return 'sliders';
  }

  function supportIconForLabel(label) {
    const text = String(label || '').toLowerCase();
    const match = SHORTCUTS.find((item) => text.includes(item.value.toLowerCase()) || text.includes(item.label.toLowerCase()));
    if (match) return match.icon;
    if (/foster/.test(text)) return 'heart';
    if (/life skill/.test(text)) return 'sparkles';
    if (/financial|money|credit/.test(text)) return 'wallet';
    if (/community|belong/.test(text)) return 'users';
    if (/parent|family/.test(text)) return 'family';
    if (/disability/.test(text)) return 'accessibility';
    if (/faith|spiritual/.test(text)) return 'sun';
    if (/entrepreneur/.test(text)) return 'lightbulb';
    if (/navigation|case management/.test(text)) return 'compass';
    return 'grid';
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
    }).filter(Boolean);
  }

  function tagList(value) {
    return String(value || '').split(';').map((item) => item.trim()).filter(Boolean);
  }

  function iconSvg(name, className = '') {
    const paths = {
      search: '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path>',
      grid: '<rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect>',
      sliders: '<path d="M4 7h10"></path><path d="M18 7h2"></path><circle cx="16" cy="7" r="2"></circle><path d="M4 17h2"></path><path d="M10 17h10"></path><circle cx="8" cy="17" r="2"></circle>',
      'map-pin': '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"></path><circle cx="12" cy="10" r="2.5"></circle>',
      heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"></path>',
      flag: '<path d="M5 21V4"></path><path d="M5 5c5-3 8 3 14 0v10c-6 3-9-3-14 0"></path>',
      bookmark: '<path d="M6 3h12v18l-6-4-6 4Z"></path>',
      house: '<path d="m3 11 9-8 9 8"></path><path d="M5 10v10h14V10"></path><path d="M9 20v-6h6v6"></path>',
      utensils: '<path d="M4 3v7a3 3 0 0 0 6 0V3"></path><path d="M7 3v18"></path><path d="M16 3v8h4"></path><path d="M20 3v18"></path>',
      briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><path d="M3 12h18"></path>',
      graduation: '<path d="m2 10 10-5 10 5-10 5Z"></path><path d="M6 12v5c3 2 9 2 12 0v-5"></path><path d="M22 10v6"></path>',
      health: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l7.8-7.5a5.5 5.5 0 0 0 1-8.9Z"></path><path d="M8 12h2l1-3 2 6 1-3h2"></path>',
      brain: '<path d="M9.5 4.5A3.5 3.5 0 0 0 6 8a3 3 0 0 0-1 5.8A3.5 3.5 0 0 0 9 19"></path><path d="M14.5 4.5A3.5 3.5 0 0 1 18 8a3 3 0 0 1 1 5.8A3.5 3.5 0 0 1 15 19"></path><path d="M9 4v16"></path><path d="M15 4v16"></path><path d="M9 9H7"></path><path d="M15 9h2"></path><path d="M9 15H7"></path><path d="M15 15h2"></path>',
      bus: '<rect x="5" y="3" width="14" height="16" rx="3"></rect><path d="M5 11h14"></path><path d="M8 7h8"></path><circle cx="8" cy="19" r="1.5"></circle><circle cx="16" cy="19" r="1.5"></circle>',
      shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"></path><path d="M9 12h6"></path><path d="M12 9v6"></path>',
      users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.9"></path><path d="M16 3.1a4 4 0 0 1 0 7.8"></path>',
      wallet: '<path d="M3 6h15a3 3 0 0 1 3 3v9H5a2 2 0 0 1-2-2Z"></path><path d="M3 6a3 3 0 0 1 3-3h11v3"></path><path d="M16 12h5"></path><circle cx="16" cy="12" r=".5"></circle>',
      sparkles: '<path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2Z"></path><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8Z"></path><path d="m5 14 .7 1.8 1.8.7-1.8.7L5 19l-.7-1.8-1.8-.7 1.8-.7Z"></path>',
      family: '<circle cx="8" cy="8" r="3"></circle><circle cx="17" cy="9" r="2.5"></circle><path d="M2 21v-2a5 5 0 0 1 10 0v2"></path><path d="M13 21v-1.5a4 4 0 0 1 8 0V21"></path>',
      accessibility: '<circle cx="12" cy="4" r="2"></circle><path d="M12 7v6"></path><path d="m8 9 4 2 4-2"></path><path d="m9 21 3-8 3 8"></path>',
      sun: '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.9 4.9 1.4 1.4"></path><path d="m17.7 17.7 1.4 1.4"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m4.9 19.1 1.4-1.4"></path><path d="m17.7 6.3 1.4-1.4"></path>',
      lightbulb: '<path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M8.5 14.5A7 7 0 1 1 15.5 14.5c-.9.7-1.5 1.7-1.5 2.5h-4c0-.8-.6-1.8-1.5-2.5Z"></path>',
      compass: '<circle cx="12" cy="12" r="9"></circle><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z"></path>'
    };
    const body = paths[name] || paths.sliders;
    return `<svg class="${escapeAttribute(className)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
  }

  function cssEscape(value) {
    if (window.CSS?.escape) return window.CSS.escape(String(value));
    return String(value).replace(/(["\\])/g, '\\$1');
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

  onReady(() => init());
})();
