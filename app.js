(() => {
  'use strict';

  const config = Object.assign({ showPartnershipPlanner: false, pageSize: 18 }, window.RESOURCE_NAVIGATOR_CONFIG || {});
  const resourceFilter = window.ResourceFilter;
  const routeState = window.ResourceRoute;
  if (!resourceFilter) throw new Error('ResourceFilter must load before app.js');
  if (!routeState) throw new Error('ResourceRoute must load before app.js');

  const state = {
    data: null,
    view: 'directory',
    query: '',
    support: 'all',
    area: 'all',
    foster: 'all',
    priority: 'all',
    savedOnly: false,
    sort: 'recommended',
    page: 1,
    saved: new Set(readJsonStorage('farm127-saved-resources', [] ).map(String)),
    partnerUpdates: readJsonStorage('farm127-partnership-updates', {})
  };

  const els = {};
  let toastTimer;

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    cacheElements();
    applyConfig();
    bindEvents();
    readUrlState();

    try {
      const response = await fetch('data/app-data.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error(`Resource data returned ${response.status}`);
      state.data = await response.json();
      populateSupportFilter();
      populateAreaFilter();
      renderAllStaticViews();
      renderStats();
      setView(state.view, false);
      renderDirectory();
      updateVerifiedFooter();
    } catch (error) {
      console.error(error);
      document.querySelectorAll('.view').forEach((view) => { view.hidden = true; });
      els.loadError.hidden = false;
    }
  }

  function cacheElements() {
    els.search = document.getElementById('search-input');
    els.support = document.getElementById('support-filter');
    els.area = document.getElementById('area-filter');
    els.foster = document.getElementById('foster-filter');
    els.priority = document.getElementById('priority-filter');
    els.savedOnly = document.getElementById('saved-filter');
    els.sort = document.getElementById('sort-select');
    els.clear = document.getElementById('clear-filters');
    els.resourceGrid = document.getElementById('resource-grid');
    els.resultCount = document.getElementById('result-count');
    els.activeFilters = document.getElementById('active-filters');
    els.pagination = document.getElementById('pagination');
    els.dialog = document.getElementById('resource-dialog');
    els.dialogContent = document.getElementById('dialog-content');
    els.dialogClose = document.getElementById('dialog-close');
    els.toast = document.getElementById('toast');
    els.loadError = document.getElementById('load-error');
    els.partnersNav = document.getElementById('partners-nav');
  }

  function applyConfig() {
    els.partnersNav.hidden = !config.showPartnershipPlanner;
  }

  function bindEvents() {
    document.querySelectorAll('[data-view]').forEach((button) => {
      button.addEventListener('click', () => {
        syncStateFromControls();
        routeState.navigate(button.dataset.view, buildUrlParams());
      });
    });

    els.search.addEventListener('input', debounce(() => {
      state.query = els.search.value.trim();
      state.page = 1;
      renderDirectory();
    }, 130));

    els.support.addEventListener('change', () => updateFilter('support', els.support.value));
    els.area.addEventListener('change', () => updateFilter('area', els.area.value));
    els.foster.addEventListener('change', () => updateFilter('foster', els.foster.value));
    els.priority.addEventListener('change', () => updateFilter('priority', els.priority.value));
    els.savedOnly.addEventListener('change', () => updateFilter('savedOnly', els.savedOnly.checked));
    els.sort.addEventListener('change', () => updateFilter('sort', els.sort.value));
    els.clear.addEventListener('click', clearFilters);

    els.resourceGrid.addEventListener('click', handleResourceGridClick);
    els.pagination.addEventListener('click', handlePaginationClick);
    els.activeFilters.addEventListener('click', handleFilterChipClick);

    els.dialogClose.addEventListener('click', () => els.dialog.close());
    els.dialog.addEventListener('click', (event) => {
      if (event.target === els.dialog) els.dialog.close();
    });
    els.dialogContent.addEventListener('click', handleDialogAction);

    document.getElementById('print-button').addEventListener('click', () => window.print());
    document.getElementById('share-button').addEventListener('click', copyCurrentLink);

    routeState.subscribe(handleRouteChange);
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

  function syncControls() {
    if (!els.search) return;
    els.search.value = state.query;
    els.support.value = state.support;
    els.area.value = state.area;
    els.foster.value = state.foster;
    els.priority.value = state.priority;
    els.savedOnly.checked = state.savedOnly;
    els.sort.value = state.sort;
  }

  function validViews() {
    const views = ['directory', 'urgent', 'foster', 'needs', 'about'];
    if (config.showPartnershipPlanner) views.push('partners');
    return views;
  }

  function setView(view, scroll = true) {
    if (!validViews().includes(view)) view = 'directory';
    state.view = view;

    document.querySelectorAll('[data-view-panel]').forEach((panel) => {
      const active = panel.dataset.viewPanel === view;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });

    document.querySelectorAll('[data-view]').forEach((button) => {
      const active = button.dataset.view === view;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-current', active ? 'page' : 'false');
    });

    if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateFilter(key, value) {
    state[key] = value;
    state.page = 1;
    renderDirectory();
  }

  function clearFilters() {
    state.query = '';
    state.support = 'all';
    state.area = 'all';
    state.foster = 'all';
    state.priority = 'all';
    state.savedOnly = false;
    state.sort = 'recommended';
    state.page = 1;
    syncControls();
    renderDirectory();
    els.search.focus();
  }

  function populateSupportFilter() {
    const supportAreas = [...new Set(state.data.resources.flatMap((resource) => tagList(resource.supportAreas)))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    for (const supportArea of supportAreas) {
      const option = document.createElement('option');
      option.value = supportArea;
      option.textContent = supportArea;
      els.support.appendChild(option);
    }
    syncControls();
  }

  function populateAreaFilter() {
    const preferredOrder = ['Charlotte / Mecklenburg', 'Surrounding communities', 'Statewide / national'];
    const areas = [...new Set(state.data.resources.map((resource) => resource.areaGroup))]
      .filter(Boolean)
      .sort((a, b) => preferredOrder.indexOf(a) - preferredOrder.indexOf(b));
    for (const area of areas) {
      const option = document.createElement('option');
      option.value = area;
      option.textContent = area === 'Surrounding communities' ? 'Surrounding communities (~30 miles)' : area;
      els.area.appendChild(option);
    }
    syncControls();
  }

  function renderStats() {
    const resources = state.data.resources;
    setText('stat-total', resources.length);
    setText('stat-local', resources.filter((item) => item.areaGroup !== 'Statewide / national').length);
    setText('stat-foster', resources.filter((item) => item.fosterSpecific === 'Yes').length);
    setText('stat-mentor', resources.filter((item) => tagList(item.supportAreas).includes('Mentorship')).length);
    setText('stat-soft', resources.filter((item) => tagList(item.supportAreas).includes('Soft skills / life skills')).length);
    setText('stat-verify', resources.filter((item) => item.priority === 'Verify').length);
  }

  function renderAllStaticViews() {
    renderTriage();
    renderFosterPrograms();
    renderNeedsMap();
    if (config.showPartnershipPlanner) renderPartnerships();
  }

  function renderDirectory() {
    if (!state.data) return;
    const filtered = getFilteredResources();
    const pageSize = Number(config.pageSize) || 18;
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    state.page = Math.min(state.page, totalPages);
    const start = (state.page - 1) * pageSize;
    const pageItems = filtered.slice(start, start + pageSize);

    els.resultCount.textContent = `${filtered.length} resource${filtered.length === 1 ? '' : 's'} found`;
    els.resourceGrid.innerHTML = pageItems.length
      ? pageItems.map(resourceCardHtml).join('')
      : emptyStateHtml();

    renderActiveFilters();
    renderPagination(totalPages);
    updateUrlState();
  }

  function getFilteredResources() {
    const priorityRank = { Core: 1, Specialized: 2, Backup: 3, Verify: 4 };

    const filtered = resourceFilter.filterResources(state.data.resources, {
      query: state.query,
      support: state.support,
      area: state.area,
      foster: state.foster,
      priority: state.priority,
      savedOnly: state.savedOnly,
      savedIds: state.saved
    });

    return filtered.sort((a, b) => {
      if (state.sort === 'name') return a.name.localeCompare(b.name);
      if (state.sort === 'support') return firstSupportArea(a).localeCompare(firstSupportArea(b)) || a.name.localeCompare(b.name);
      if (state.sort === 'verified') return String(b.lastVerified).localeCompare(String(a.lastVerified)) || a.name.localeCompare(b.name);

      const priorityDiff = (priorityRank[a.priority] || 9) - (priorityRank[b.priority] || 9);
      if (priorityDiff) return priorityDiff;
      const fosterDiff = fosterRank(a.fosterSpecific) - fosterRank(b.fosterSpecific);
      return fosterDiff || a.name.localeCompare(b.name);
    });
  }

  function resourceCardHtml(resource) {
    const saved = state.saved.has(String(resource.id));
    const phone = firstPhone(resource.phone);
    const source = safeUrl(resource.sourceUrl);

    const areas = tagList(resource.supportAreas);
    const primaryArea = areas[0] || 'Community resource';

    return `
      <article class="resource-card" data-resource-id="${escapeHtml(resource.id)}">
        <div class="card-topline">
          <span class="category-label">${escapeHtml(primaryArea)}</span>
          <button class="icon-button ${saved ? 'is-saved' : ''}" type="button" data-action="save" aria-label="${saved ? 'Remove from saved resources' : 'Save resource'}" title="${saved ? 'Remove saved resource' : 'Save resource'}">${saved ? '★' : '☆'}</button>
        </div>
        <div class="tag-row">
          ${priorityTag(resource.priority)}
          ${fosterTag(resource.fosterSpecific)}
          ${localTag(resource.areaGroup)}
        </div>
        ${supportAreasHtml(resource.supportAreas, 4, true)}
        <h2>${escapeHtml(resource.name)}</h2>
        <p class="trigger">${escapeHtml(resource.referralTrigger)}</p>
        <div class="meta-list">
          ${resource.area ? `<div class="meta-line"><span aria-hidden="true">◎</span><span>${escapeHtml(resource.area)}</span></div>` : ''}
          ${resource.location ? `<div class="meta-line"><span aria-hidden="true">⌂</span><span>${escapeHtml(resource.location)}</span></div>` : ''}
          ${resource.phone ? `<div class="meta-line"><span aria-hidden="true">☎</span><span><strong>${escapeHtml(resource.phone)}</strong></span></div>` : ''}
          <div class="meta-line"><span aria-hidden="true">✓</span><span>Verified ${escapeHtml(formatDate(resource.lastVerified))}</span></div>
        </div>
        ${resource.priority === 'Verify' ? `<div class="caveat"><strong>Verify before referral:</strong> ${escapeHtml(resource.caveat)}</div>` : ''}
        <div class="card-actions">
          <button class="button button-primary button-small" type="button" data-action="details">View details</button>
          ${phone ? `<a class="button button-secondary button-small" href="tel:${phone}">Call</a>` : ''}
          ${source ? `<a class="button button-quiet button-small" href="${escapeAttribute(source)}" target="_blank" rel="noopener noreferrer">Official source</a>` : ''}
        </div>
      </article>`;
  }

  function priorityTag(priority) {
    const css = priority === 'Core' ? 'tag-core' : priority === 'Verify' ? 'tag-verify' : '';
    return `<span class="tag ${css}">${escapeHtml(priority)}</span>`;
  }

  function fosterTag(value) {
    if (!value || value === 'No') return '';
    const label = value === 'Yes' ? 'Foster-care specific' : 'Youth / foster relevant';
    return `<span class="tag tag-foster">${label}</span>`;
  }

  function localTag(areaGroup) {
    if (!areaGroup || areaGroup === 'Statewide / national') return '';
    const label = areaGroup === 'Surrounding communities' ? 'Nearby community' : 'Charlotte / Mecklenburg';
    return `<span class="tag tag-local">${escapeHtml(label)}</span>`;
  }

  function tagList(value) {
    return String(value || '').split(';').map((tag) => tag.trim()).filter(Boolean);
  }

  function supportAreasHtml(value, limit = 4, skipFirst = false) {
    const areas = tagList(value);
    const displayAreas = skipFirst ? areas.slice(1) : areas;
    if (!displayAreas.length) return '';
    const visible = displayAreas.slice(0, limit);
    const remainder = displayAreas.length - visible.length;
    return `<div class="focus-tag-row">${visible.map((area) => `<span class="focus-tag">${escapeHtml(area)}</span>`).join('')}${remainder > 0 ? `<span class="focus-tag focus-tag-more">+${remainder}</span>` : ''}</div>`;
  }

  function firstSupportArea(resource) {
    return tagList(resource.supportAreas)[0] || '';
  }

  function emptyStateHtml() {
    return `<div class="empty-state"><h2>No matching resources</h2><p>Try a broader search or clear one of the filters.</p><button class="button button-primary" type="button" data-action="clear-empty">Clear filters</button></div>`;
  }

  function handleResourceGridClick(event) {
    const actionElement = event.target.closest('[data-action]');
    if (!actionElement) return;
    if (actionElement.dataset.action === 'clear-empty') {
      clearFilters();
      return;
    }

    const card = actionElement.closest('[data-resource-id]');
    if (!card) return;
    const resource = findResource(card.dataset.resourceId);
    if (!resource) return;

    if (actionElement.dataset.action === 'save') toggleSaved(resource.id);
    if (actionElement.dataset.action === 'details') openResourceDialog(resource);
  }

  function toggleSaved(id) {
    const key = String(id);
    if (state.saved.has(key)) {
      state.saved.delete(key);
      showToast('Removed from saved resources');
    } else {
      state.saved.add(key);
      showToast('Saved resource');
    }
    writeJsonStorage('farm127-saved-resources', [...state.saved]);
    renderDirectory();
  }

  function openResourceDialog(resource) {
    const source = safeUrl(resource.sourceUrl);
    const phone = firstPhone(resource.phone);
    const saved = state.saved.has(String(resource.id));

    els.dialogContent.innerHTML = `
      <div class="dialog-title">
        <p class="eyebrow">${escapeHtml(firstSupportArea(resource) || 'Community resource')}</p>
        <h2>${escapeHtml(resource.name)}</h2>
        <div class="tag-row">${priorityTag(resource.priority)}${fosterTag(resource.fosterSpecific)}${localTag(resource.areaGroup)}</div>
        ${supportAreasHtml(resource.supportAreas, 8)}
      </div>
      <div class="detail-grid">
        ${detailBlock('Best for', resource.referralTrigger, true)}
        ${detailBlock('Age / eligibility', resource.eligibility)}
        ${detailBlock('What it provides', resource.provides, true)}
        ${detailBlock('How to access', resource.access, true)}
        ${detailBlock('Phone', resource.phone)}
        ${detailBlock('Area', resource.area)}
        ${detailBlock('Location / service area', resource.location)}
        ${detailBlock('Support areas', tagList(resource.supportAreas).join(' · '), true)}
        ${detailBlock('Local-area note', resource.radiusNote, true)}
        ${detailBlock('Capacity / verification caveat', resource.caveat, true)}
        ${detailBlock('Last verified', formatDate(resource.lastVerified))}
      </div>
      <div class="dialog-actions">
        ${phone ? `<a class="button button-primary" href="tel:${phone}">Call ${escapeHtml(resource.phone)}</a>` : ''}
        ${source ? `<a class="button button-secondary" href="${escapeAttribute(source)}" target="_blank" rel="noopener noreferrer">Open official source</a>` : ''}
        <button class="button button-quiet" type="button" data-dialog-action="copy" data-id="${escapeAttribute(resource.id)}">Copy referral summary</button>
        <button class="button button-quiet" type="button" data-dialog-action="save" data-id="${escapeAttribute(resource.id)}">${saved ? 'Remove saved resource' : 'Save resource'}</button>
      </div>`;

    if (typeof els.dialog.showModal === 'function' && !els.dialog.open) els.dialog.showModal();
    else els.dialog.setAttribute('open', '');
  }

  function detailBlock(title, value, full = false) {
    if (!value) return '';
    return `<section class="detail-block ${full ? 'full' : ''}"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(value)}</p></section>`;
  }

  function handleDialogAction(event) {
    const button = event.target.closest('[data-dialog-action]');
    if (!button) return;
    const resource = findResource(button.dataset.id);
    if (!resource) return;

    if (button.dataset.dialogAction === 'copy') {
      copyText(referralSummary(resource), 'Referral summary copied');
    } else if (button.dataset.dialogAction === 'save') {
      toggleSaved(resource.id);
      openResourceDialog(resource);
    }
  }

  function referralSummary(resource) {
    return [
      resource.name,
      `Best for: ${resource.referralTrigger}`,
      `Eligibility: ${resource.eligibility}`,
      `Provides: ${resource.provides}`,
      `Access: ${resource.access}`,
      resource.phone ? `Phone: ${resource.phone}` : '',
      resource.area ? `Area: ${resource.area}` : '',
      resource.location ? `Location: ${resource.location}` : '',
      resource.supportAreas ? `Support areas: ${tagList(resource.supportAreas).join(', ')}` : '',
      `Important: ${resource.caveat}`,
      resource.sourceUrl ? `Official source: ${resource.sourceUrl}` : '',
      `Last verified: ${formatDate(resource.lastVerified)}`
    ].filter(Boolean).join('\n');
  }

  function renderActiveFilters() {
    const chips = [];
    if (state.query) chips.push(['query', `Search: ${state.query}`]);
    if (state.support !== 'all') chips.push(['support', state.support]);
    if (state.area !== 'all') chips.push(['area', state.area === 'Surrounding communities' ? 'Nearby communities (~30 miles)' : state.area]);
    if (state.foster !== 'all') chips.push(['foster', fosterFilterLabel(state.foster)]);
    if (state.priority !== 'all') chips.push(['priority', state.priority]);
    if (state.savedOnly) chips.push(['savedOnly', 'Saved only']);

    els.activeFilters.innerHTML = chips.map(([key, label]) =>
      `<button type="button" class="filter-chip" data-clear-filter="${escapeAttribute(key)}">${escapeHtml(label)} ×</button>`
    ).join('');
  }

  function handleFilterChipClick(event) {
    const button = event.target.closest('[data-clear-filter]');
    if (!button) return;
    const key = button.dataset.clearFilter;
    if (key === 'query') state.query = '';
    else if (key === 'savedOnly') state.savedOnly = false;
    else state[key] = 'all';
    state.page = 1;
    syncControls();
    renderDirectory();
  }

  function fosterFilterLabel(value) {
    return value === 'yes' ? 'Foster-care specific' : value === 'partial' ? 'Youth / partially specific' : 'General resource';
  }

  function renderPagination(totalPages) {
    if (totalPages <= 1) {
      els.pagination.innerHTML = '';
      return;
    }

    const pages = paginationRange(state.page, totalPages);
    els.pagination.innerHTML = pages.map((page) => {
      if (page === '…') return `<span class="page-button" aria-hidden="true">…</span>`;
      return `<button type="button" class="page-button ${page === state.page ? 'is-active' : ''}" data-page="${page}" aria-label="Page ${page}" ${page === state.page ? 'aria-current="page"' : ''}>${page}</button>`;
    }).join('');
  }

  function handlePaginationClick(event) {
    const button = event.target.closest('[data-page]');
    if (!button) return;
    state.page = Number(button.dataset.page);
    renderDirectory();
    document.querySelector('.results-toolbar').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function paginationRange(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
    const set = new Set([1, total, current - 1, current, current + 1].filter((page) => page >= 1 && page <= total));
    const sorted = [...set].sort((a, b) => a - b);
    const output = [];
    sorted.forEach((page, index) => {
      if (index && page - sorted[index - 1] > 1) output.push('…');
      output.push(page);
    });
    return output;
  }

  function renderTriage() {
    document.getElementById('triage-grid').innerHTML = state.data.triage.map((item) => {
      const phone = firstPhone(item.phone);
      return `
        <article class="triage-card">
          <h2>${escapeHtml(item.situation)}</h2>
          <div class="triage-action">
            <div><span class="eyebrow">First action</span><strong>${escapeHtml(item.firstAction)}</strong></div>
            ${phone ? `<a class="button button-primary" href="tel:${phone}">${escapeHtml(item.phone)}</a>` : ''}
          </div>
          <div class="triage-detail">
            <div><strong>Backup / next step</strong><p>${escapeHtml(item.backup)}</p></div>
            <div><strong>Important limit</strong><p>${escapeHtml(item.limit)}</p></div>
          </div>
        </article>`;
    }).join('');
  }

  function renderFosterPrograms() {
    const headers = ['Program', 'Age window', 'Eligibility trigger', 'Primary value', 'Recommended next step', 'Source'];
    const rows = state.data.fosterPrograms.map((item) => [
      `<strong>${escapeHtml(item.program)}</strong>`,
      escapeHtml(item.ageWindow),
      escapeHtml(item.eligibilityTrigger),
      escapeHtml(item.primaryValue),
      escapeHtml(item.recommendedAction),
      safeUrl(item.sourceUrl) ? `<a href="${escapeAttribute(safeUrl(item.sourceUrl))}" target="_blank" rel="noopener noreferrer">Official page</a>` : ''
    ]);
    document.getElementById('foster-table').innerHTML = tableHtml(headers, rows);
  }

  function renderNeedsMap() {
    document.getElementById('needs-grid').innerHTML = state.data.needsMap.map((item) => `
      <article class="need-card">
        <h2>${escapeHtml(item.domain)}</h2>
        <div class="need-section"><strong>Primary options</strong><p>${escapeHtml(item.primaryOptions)}</p></div>
        <div class="need-section"><strong>Backup / specialist options</strong><p>${escapeHtml(item.backupOptions)}</p></div>
        <div class="need-section"><strong>Referral strategy</strong><p>${escapeHtml(item.strategy)}</p></div>
      </article>`).join('');
  }

  function renderPartnerships() {
    const headers = ['Organization', 'Why strategic', 'Suggested first ask', 'Referral pathway', 'Priority', 'Status', 'Owner', 'Notes'];
    const statuses = ['Not started', 'Outreach sent', 'Meeting scheduled', 'Referral pathway confirmed', 'Paused'];
    const rows = state.data.partnerships.map((item, index) => {
      const key = partnerKey(item.organization);
      const update = state.partnerUpdates[key] || {};
      const selectedStatus = update.status || item.status || 'Not started';
      const owner = update.owner || item.owner || '';
      const notes = update.notes || item.notes || '';
      return [
        `<strong>${escapeHtml(item.organization)}</strong>`,
        escapeHtml(item.whyStrategic),
        escapeHtml(item.suggestedFirstAsk),
        escapeHtml(item.referralPathway),
        escapeHtml(item.priority),
        `<select class="partner-input" data-partner-field="status" data-partner-index="${index}">${statuses.map((status) => `<option value="${escapeAttribute(status)}" ${status === selectedStatus ? 'selected' : ''}>${escapeHtml(status)}</option>`).join('')}</select>`,
        `<input class="partner-input" data-partner-field="owner" data-partner-index="${index}" value="${escapeAttribute(owner)}" aria-label="Owner for ${escapeAttribute(item.organization)}">`,
        `<textarea class="partner-textarea" data-partner-field="notes" data-partner-index="${index}" aria-label="Notes for ${escapeAttribute(item.organization)}">${escapeHtml(notes)}</textarea>`
      ];
    });

    const container = document.getElementById('partners-table');
    container.innerHTML = tableHtml(headers, rows);
    container.addEventListener('change', savePartnerUpdate);
    container.addEventListener('input', debounce(savePartnerUpdate, 250));
  }

  function savePartnerUpdate(event) {
    const input = event.target.closest('[data-partner-field]');
    if (!input) return;
    const item = state.data.partnerships[Number(input.dataset.partnerIndex)];
    if (!item) return;
    const key = partnerKey(item.organization);
    state.partnerUpdates[key] = state.partnerUpdates[key] || {};
    state.partnerUpdates[key][input.dataset.partnerField] = input.value;
    writeJsonStorage('farm127-partnership-updates', state.partnerUpdates);
  }

  function tableHtml(headers, rows) {
    return `<table class="data-table"><thead><tr>${headers.map((header) => `<th scope="col">${escapeHtml(header)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell, index) => `<td data-label="${escapeAttribute(headers[index])}">${cell}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }

  function updateVerifiedFooter() {
    const date = formatDate(state.data.meta.verifiedDate);
    document.getElementById('verified-footer').textContent = `Directory last verified ${date}. Confirm current eligibility and capacity before referral.`;
  }

  function syncStateFromControls() {
    if (!els.search) return;
    state.query = els.search.value.trim();
    state.support = els.support.value;
    state.area = els.area.value;
    state.foster = els.foster.value;
    state.priority = els.priority.value;
    state.savedOnly = els.savedOnly.checked;
    state.sort = els.sort.value;
  }

  function buildUrlParams() {
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

  function copyCurrentLink() {
    updateUrlState();
    copyText(window.location.href, 'Link copied');
  }

  function copyText(text, successMessage) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => showToast(successMessage)).catch(() => fallbackCopy(text, successMessage));
    } else {
      fallbackCopy(text, successMessage);
    }
  }

  function fallbackCopy(text, successMessage) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand('copy');
      showToast(successMessage);
    } catch {
      showToast('Copy failed');
    }
    area.remove();
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add('is-visible');
    toastTimer = setTimeout(() => els.toast.classList.remove('is-visible'), 2200);
  }

  function findResource(id) {
    return state.data.resources.find((resource) => String(resource.id) === String(id));
  }

  function firstPhone(value) {
    if (!value) return '';
    const keypad = { A: 2, B: 2, C: 2, D: 3, E: 3, F: 3, G: 4, H: 4, I: 4, J: 5, K: 5, L: 5, M: 6, N: 6, O: 6, P: 7, Q: 7, R: 7, S: 7, T: 8, U: 8, V: 8, W: 9, X: 9, Y: 9, Z: 9 };
    const firstChunk = String(value).split(/[\/|]/)[0].toUpperCase();
    const mapped = firstChunk.replace(/[A-Z]/g, (letter) => keypad[letter] || '');
    const digits = mapped.replace(/[^0-9]/g, '');
    if (digits.length === 3) return digits;
    if (digits.startsWith('1') && digits.length >= 11) return digits.slice(0, 11);
    if (digits.length >= 10) return digits.slice(0, 10);
    return digits.length >= 3 ? digits : '';
  }

  function safeUrl(value) {
    if (!value) return '';
    try {
      const url = new URL(value, window.location.origin);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch {
      return '';
    }
  }

  function formatDate(value) {
    if (!value) return 'date unavailable';
    const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
  }

  function fosterRank(value) {
    return value === 'Yes' ? 1 : value === 'Partial' ? 2 : 3;
  }

  function partnerKey(value) {
    return normalize(value).replace(/\s+/g, '-');
  }

  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  function setText(id, value) {
    document.getElementById(id).textContent = value;
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

  function readJsonStorage(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJsonStorage(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage may be disabled */ }
  }

  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }
})();
