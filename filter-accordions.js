(() => {
  'use strict';

  const SUPPORT_PREFIX = '__rn_support__:';
  const QUERY_PREFIX = '__rn_query__:';
  const SAVED_STORAGE_KEY = 'farm127-saved-resources';
  let resources = [];
  let updateQueued = false;

  function onReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  }

  function init(attempt = 0) {
    const panel = document.querySelector('#view-directory .filter-panel');
    const supportGroup = panel?.querySelector('.filter-checklist');
    const toggleGroup = panel?.querySelector('.filter-toggle-group');

    if (!panel || !supportGroup || !toggleGroup) {
      if (attempt < 40) window.setTimeout(() => init(attempt + 1), 100);
      return;
    }

    enhanceAccordion(supportGroup, 'support-area-filters');
    enhanceAccordion(toggleGroup, 'additional-filters');
    bindUpdates(panel);

    fetch('data/app-data.json', { cache: 'no-cache' })
      .then((response) => {
        if (!response.ok) throw new Error(`Resource data returned ${response.status}`);
        return response.json();
      })
      .then((data) => {
        resources = Array.isArray(data?.resources) ? data.resources : [];
        updateCounts();
      })
      .catch((error) => {
        console.error('Filter counts could not be loaded:', error);
      });
  }

  function enhanceAccordion(group, idBase) {
    if (group.dataset.accordionReady === 'true') return;
    group.dataset.accordionReady = 'true';
    group.classList.add('filter-accordion');

    const legend = group.querySelector(':scope > legend');
    if (!legend) return;

    const title = legend.textContent.trim();
    const content = document.createElement('div');
    content.className = 'filter-accordion-content';
    content.id = `${idBase}-content`;

    [...group.children]
      .filter((child) => child !== legend)
      .forEach((child) => content.appendChild(child));

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'filter-accordion-toggle';
    toggle.setAttribute('aria-controls', content.id);
    toggle.setAttribute('aria-expanded', 'true');
    toggle.innerHTML = `
      <span>${escapeHtml(title)}</span>
      <svg class="filter-accordion-chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="m6 9 6 6 6-6"></path>
      </svg>`;

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      content.hidden = expanded;
    });

    legend.textContent = '';
    legend.appendChild(toggle);
    group.appendChild(content);
  }

  function bindUpdates(panel) {
    const scheduleUpdate = () => {
      if (updateQueued) return;
      updateQueued = true;
      window.requestAnimationFrame(() => {
        updateQueued = false;
        updateCounts();
      });
    };

    panel.addEventListener('input', scheduleUpdate);
    panel.addEventListener('change', scheduleUpdate);
    window.addEventListener('popstate', () => window.setTimeout(scheduleUpdate, 0));
    window.addEventListener('storage', (event) => {
      if (event.key === SAVED_STORAGE_KEY) scheduleUpdate();
    });

    document.addEventListener('click', (event) => {
      if (event.target.closest('[data-action="save"], #clear-filters, [data-clear-filter]')) {
        window.setTimeout(scheduleUpdate, 0);
      }
    });

    const resultCount = document.getElementById('result-count');
    if (resultCount) {
      new MutationObserver(scheduleUpdate).observe(resultCount, {
        childList: true,
        characterData: true,
        subtree: true
      });
    }
  }

  function updateCounts() {
    if (!resources.length) return;
    const current = readCurrentFilters();

    document.querySelectorAll('.support-area-checkbox').forEach((input) => {
      const count = countMatches({ ...current, supportValues: [input.value] });
      setOptionCount(input, count);
    });

    const foster = document.getElementById('foster-filter-toggle');
    if (foster) {
      setOptionCount(foster, countMatches({ ...current, foster: 'yes' }));
    }

    const urgent = document.getElementById('urgent-filter-toggle');
    if (urgent) {
      setOptionCount(urgent, countMatches({ ...current, urgent: true }));
    }

    const saved = document.getElementById('saved-filter');
    if (saved) {
      setOptionCount(saved, countMatches({ ...current, savedOnly: true }));
    }
  }

  function readCurrentFilters() {
    const query = decodeQueryValue(document.getElementById('search-input')?.value || '');
    return {
      text: query.text,
      urgent: query.urgent,
      charlotteOnly: query.charlotte,
      supportValues: decodeSupportValue(document.getElementById('support-filter')?.value || 'all'),
      foster: document.getElementById('foster-filter')?.value || 'all',
      area: document.getElementById('area-filter')?.value || 'all',
      priority: document.getElementById('priority-filter')?.value || 'all',
      savedOnly: document.getElementById('saved-filter')?.checked || false,
      savedIds: readSavedIds()
    };
  }

  function countMatches(filters) {
    return resources.reduce((count, resource) => count + (matchesFilters(resource, filters) ? 1 : 0), 0);
  }

  function matchesFilters(resource, filters) {
    const areas = tagList(resource.supportAreas);
    if (filters.supportValues.length && !filters.supportValues.some((value) => areas.includes(value))) return false;

    if (filters.area !== 'all' && resource.areaGroup !== filters.area) return false;
    if (filters.priority !== 'all' && resource.priority !== filters.priority) return false;
    if (filters.charlotteOnly && resource.areaGroup === 'Surrounding communities') return false;

    if (filters.foster !== 'all') {
      const foster = normalize(resource.fosterSpecific);
      if (filters.foster === 'yes' && foster !== 'yes') return false;
      if (filters.foster === 'partial' && foster !== 'partial') return false;
      if (filters.foster === 'no' && foster !== 'no') return false;
    }

    if (filters.savedOnly && !filters.savedIds.has(String(resource.id))) return false;

    const haystack = normalize([
      resource.name,
      resource.supportAreas,
      resource.referralTrigger,
      resource.eligibility,
      resource.provides,
      resource.access,
      resource.location,
      resource.phone,
      resource.caveat,
      resource.fosterSpecific,
      resource.priority,
      resource.area,
      resource.areaGroup,
      resource.radiusNote
    ].join(' '));

    if (filters.text && !haystack.includes(normalize(filters.text))) return false;
    if (filters.urgent && !matchesUrgentNeed(haystack)) return false;
    return true;
  }

  function matchesUrgentNeed(haystack) {
    const strongSignals = [
      'call 911', 'call or text 988', '988', '24/7', '24 hours', 'crisis line',
      'crisis hotline', 'emergency shelter', 'emergency food', 'same day', 'same-day',
      'tonight', 'immediate danger', 'overdose', 'domestic violence', 'sexual assault',
      'human trafficking', 'coordinated entry', 'shelter bed', 'walk-in crisis', 'urgent care'
    ];

    if (strongSignals.some((signal) => haystack.includes(signal))) return true;

    const urgentAreas = [
      'housing / homelessness',
      'food and basic needs',
      'mental health',
      'safety / domestic violence / trafficking',
      'substance-use recovery'
    ];
    const accessSignals = ['emergency', 'crisis', 'hotline', 'immediate', 'walk-in', 'shelter', 'same day'];

    return urgentAreas.some((area) => haystack.includes(area))
      && accessSignals.some((signal) => haystack.includes(signal))
      && !haystack.includes('not an emergency service');
  }

  function setOptionCount(input, count) {
    const label = input.closest('.filter-check-option');
    const text = label?.querySelector(':scope > span');
    if (!text) return;

    let countElement = text.querySelector('.filter-result-count');
    if (!countElement) {
      countElement = document.createElement('span');
      countElement.className = 'filter-result-count';
      text.append(' ', countElement);
    }

    countElement.textContent = `(${count})`;
    countElement.setAttribute('aria-label', `${count} applicable result${count === 1 ? '' : 's'}`);
    label.classList.toggle('has-no-results', count === 0);
  }

  function readSavedIds() {
    try {
      const value = JSON.parse(localStorage.getItem(SAVED_STORAGE_KEY) || '[]');
      return new Set(Array.isArray(value) ? value.map(String) : []);
    } catch {
      return new Set();
    }
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

  function tagList(value) {
    return String(value || '').split(';').map((item) => item.trim()).filter(Boolean);
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  onReady(() => init());
})();
