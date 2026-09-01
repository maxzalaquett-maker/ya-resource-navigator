(() => {
  'use strict';

  const CONFIG = Object.assign({
    phase1Enabled: true,
    feedbackUrl: 'https://github.com/maxzalaquett-maker/ya-resource-navigator/issues/new',
    verificationFreshDays: 30,
    verificationCurrentDays: 90,
    verificationAgingDays: 180
  }, window.RESOURCE_NAVIGATOR_CONFIG || {});

  if (!CONFIG.phase1Enabled) return;

  const PLAN_KEY = 'resource-navigator-support-plan-v1';
  const SAVED_KEY = 'farm127-saved-resources';
  const PLAN_META_KEY = 'resource-navigator-support-plan-meta-v1';
  const state = {
    data: null,
    pathways: [],
    planIds: new Set(),
    planMeta: {},
    selectedNeed: '',
    selectedUrgency: '',
    county: 'Mecklenburg',
    fosterHistory: 'prefer-not'
  };

  const PATHWAY_ROLE_LABELS = {
    Core: 'Best place to start',
    Specialized: 'For a specific need',
    Backup: 'Try this next',
    Verify: 'Try this next'
  };

  const STATUS_OPTIONS = [
    'Want to contact',
    'Called or messaged',
    'Started the application',
    'Waiting to hear back',
    'Got help',
    'Did not qualify',
    'No openings',
    'Try another option'
  ];

  const NEED_SUPPORT_MAP = [
    [/housing|homeless|shelter|rent/i, 'Housing / homelessness'],
    [/food|essential|clothing|household/i, 'Food / essentials'],
    [/job|work|employment|career/i, 'Employment / workforce'],
    [/school|education|college|ged|training/i, 'Education'],
    [/transport|car|bus|ride/i, 'Transportation'],
    [/mental|recovery|substance|therapy|counsel/i, 'Mental health / recovery'],
    [/health|medical|dental|insurance/i, 'Health care'],
    [/legal|identity|document|id|safety/i, 'Legal / identity / safety'],
    [/money|budget|benefit|financial/i, 'Financial capability'],
    [/mentor|relationship|community|belong/i, 'Community / belonging']
  ];

  function ready(callback) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', callback, { once: true });
    else callback();
  }

  ready(init);

  async function init() {
    migratePlanStorage();
    enhanceLabels();
    installGlobalHandlers();
    installObservers();

    try {
      const [dataResponse, pathwayResponse] = await Promise.all([
        fetch('/data/app-data.json', { cache: 'no-cache' }),
        fetch('/data/pathways.json', { cache: 'no-cache' })
      ]);
      if (!dataResponse.ok) throw new Error(`Resource data returned ${dataResponse.status}`);
      state.data = await dataResponse.json();
      state.pathways = pathwayResponse.ok ? (await pathwayResponse.json()).pathways || [] : [];
      decorateResourceData();
      injectGuidedExperience();
      injectPlanPanel();
      injectReportDialog();
      updateVerificationSummary();
      enhanceRenderedContent();
    } catch (error) {
      console.error('Phase 1 enhancements could not load:', error);
    }
  }

  function migratePlanStorage() {
    const existingPlan = readJson(PLAN_KEY, null);
    const legacySaved = readJson(SAVED_KEY, []);
    const ids = Array.isArray(existingPlan) ? existingPlan : Array.isArray(legacySaved) ? legacySaved : [];
    state.planIds = new Set(ids.map(String));
    state.planMeta = readJson(PLAN_META_KEY, {});
    persistPlan();
  }

  function decorateResourceData() {
    if (!Array.isArray(state.data?.resources)) return;
    state.data.resources.forEach((resource) => {
      resource.pathwayRole = PATHWAY_ROLE_LABELS[resource.priority] || 'Another option';
      resource.verification = verificationFor(resource);
      resource.intakeStatus = inferIntakeStatus(resource);
      resource.applicationMethod = inferApplicationMethod(resource);
      resource.referralRequirement = inferReferralRequirement(resource);
      resource.requiredDocuments = inferDocuments(resource);
      resource.expectedResponse = inferExpectedResponse(resource);
    });
  }

  function enhanceLabels() {
    const sortOption = document.querySelector('#sort-select option[value="recommended"]');
    if (sortOption) sortOption.textContent = 'Where to start';

    const prioritySelect = document.getElementById('priority-filter');
    if (prioritySelect) {
      const label = prioritySelect.closest('label')?.querySelector('span');
      if (label) label.textContent = 'Where to start';
      const labels = {
        all: 'All starting points',
        Core: 'Best place to start',
        Specialized: 'For a specific need',
        Backup: 'Try this next',
        Verify: 'Check before you go'
      };
      [...prioritySelect.options].forEach((option) => {
        if (labels[option.value]) option.textContent = labels[option.value];
      });
    }

    const savedLabel = document.querySelector('label.check-field span');
    if (savedLabel) savedLabel.textContent = 'Show only programs in my plan';
  }

  function injectGuidedExperience() {
    const mount = document.getElementById('guided-pathway-mount');
    if (!mount || document.getElementById('phase1-guided')) return;

    const section = document.createElement('section');
    section.id = 'phase1-guided';
    section.className = 'phase1-guided';
    section.innerHTML = `
      <div class="phase1-guided-heading">
        <div>
          <p class="eyebrow">Answer a few questions</p>
          <h2>Find a good place to start</h2>
          <p>You will not be asked for your name, birth date, address or private history.</p>
        </div>
        <button class="button button-quiet" type="button" data-phase1-browse>Browse all programs</button>
      </div>

      <form id="phase1-pathway-form" class="phase1-form">
        <fieldset>
          <legend>1. What do you need help with?</legend>
          <div class="phase1-option-grid">
            ${radioCard('need', 'unsafe', 'I need a safe place tonight', 'I do not have a safe place to sleep tonight.')}
            ${radioCard('need', 'housing-risk', 'I may lose my housing soon', 'I may have to leave where I am staying soon.')}
            ${radioCard('need', 'multiple', 'I need help with more than one thing', 'I am not sure what to handle first.')}
          </div>
        </fieldset>

        <fieldset>
          <legend>2. How soon do you need help?</legend>
          <div class="phase1-option-grid">
            ${radioCard('urgency', 'immediate', 'I need help right now', 'Waiting may not be safe.')}
            ${radioCard('urgency', 'days', 'Within a few days', 'Something important may change very soon.')}
            ${radioCard('urgency', 'planning', 'I am planning ahead', 'I have some time to figure out my next step.')}
          </div>
        </fieldset>

        <fieldset>
          <legend>3. A little more about you</legend>
          <div class="phase1-field-grid">
            <label class="field"><span>Where do you live?</span>
              <select name="county">
                <option value="Mecklenburg">Mecklenburg County</option>
                <option value="Nearby">A county near Charlotte</option>
                <option value="OtherNC">Another part of North Carolina</option>
              </select>
            </label>
            <label class="field"><span>Have you ever been in foster care?</span>
              <select name="fosterHistory">
                <option value="prefer-not">Prefer not to answer</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
          </div>
        </fieldset>

        <div class="phase1-form-actions">
          <button class="button button-primary" type="submit">Show my next steps</button>
          <button class="button button-quiet" type="reset">Start over</button>
        </div>
        <p class="phase1-form-error" id="phase1-form-error" role="alert" hidden></p>
      </form>
      <div id="phase1-results" class="phase1-results" aria-live="polite"></div>`;

    mount.appendChild(section);

    section.querySelector('[data-phase1-browse]')?.addEventListener('click', () => {
      document.querySelector('.nav-tab[data-view="directory"]')?.click();
      window.setTimeout(() => document.getElementById('directory-browser')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    });

    const form = document.getElementById('phase1-pathway-form');
    form.addEventListener('submit', handlePathwaySubmit);
    form.addEventListener('reset', () => {
      setTimeout(() => {
        state.selectedNeed = '';
        state.selectedUrgency = '';
        document.getElementById('phase1-results').innerHTML = '';
        document.getElementById('phase1-form-error').hidden = true;
      }, 0);
    });
  }

  function radioCard(name, value, title, description) {
    return `<label class="phase1-radio-card"><input type="radio" name="${name}" value="${value}"><span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(description)}</small></span></label>`;
  }

  function handlePathwaySubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    state.selectedNeed = String(form.get('need') || '');
    state.selectedUrgency = String(form.get('urgency') || '');
    state.county = String(form.get('county') || 'Mecklenburg');
    state.fosterHistory = String(form.get('fosterHistory') || 'prefer-not');

    const error = document.getElementById('phase1-form-error');
    if (!state.selectedNeed || !state.selectedUrgency) {
      error.textContent = 'Choose what you need help with and how soon you need it.';
      error.hidden = false;
      return;
    }
    error.hidden = true;

    if (state.selectedUrgency === 'immediate') {
      renderImmediateResult();
      return;
    }

    const pathwayId = state.selectedNeed === 'unsafe'
      ? 'unsafe-tonight'
      : state.selectedNeed === 'housing-risk'
        ? 'housing-risk'
        : 'multiple-needs';
    renderPathway(pathwayId);
  }

  function renderImmediateResult() {
    const container = document.getElementById('phase1-results');
    container.innerHTML = `
      <section class="phase1-result-card phase1-result-urgent">
        <p class="eyebrow">Help right now</p>
        <h3>Get help right now</h3>
        <p>Call 911 if you are in immediate danger, badly hurt or dealing with an overdose. If you may hurt yourself or need someone to talk to right now, call or text 988.</p>
        <div class="card-actions">
          <a class="button button-danger" href="tel:911">Call 911</a>
          <a class="button button-primary" href="tel:988">Call or text 988</a>
          <button class="button button-secondary" type="button" data-scroll-urgent>See more urgent help</button>
        </div>
      </section>`;
    container.querySelector('[data-scroll-urgent]')?.addEventListener('click', () => document.getElementById('urgent-support')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderPathway(pathwayId) {
    const pathway = state.pathways.find((item) => item.id === pathwayId);
    const container = document.getElementById('phase1-results');
    if (!pathway) {
      container.innerHTML = '<p class="phase1-empty">These questions are not available right now. Browse all programs instead.</p>';
      return;
    }

    const primary = resourceList(pathway.primaryResourceIds);
    const backups = resourceList(pathway.backupResourceIds);
    const outsideMecklenburg = state.county !== 'Mecklenburg';
    const fosterNote = state.fosterHistory === 'yes'
      ? '<div class="phase1-context-note"><strong>You may qualify for extra help because you were in foster care.</strong> Check the Help after foster care page for programs with age deadlines.</div>'
      : '';
    const locationNote = outsideMecklenburg
      ? '<div class="phase1-context-note"><strong>Check where the program is available.</strong> Some programs below only serve Mecklenburg County. NC 211 can help you find a similar program in another county.</div>'
      : '';

    container.innerHTML = `
      <section class="phase1-result-card">
        <p class="eyebrow">A good place to start</p>
        <h3>${escapeHtml(pathway.title)}</h3>
        <p>${escapeHtml(pathway.summary)}</p>
        ${locationNote}${fosterNote}

     <div class="phase1-pathway-steps">
          <section>
            <h4>Start here</h4>
            ${primary.map((resource) => pathwayResourceHtml(resource, 'primary')).join('') || '<p>No starting program is available right now.</p>'}
          </section>
          <section>
            <h4>Try this next if the first program cannot help</h4>
            ${backups.map((resource) => pathwayResourceHtml(resource, 'backup')).join('') || '<p>No other program is listed right now.</p>'}
          </section>
        </div>

        <div class="phase1-prep-grid">
          <section><h4>Have these ready</h4><ul>${pathway.documents.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>
          <section><h4>What to ask for</h4><ul>${pathway.successCriteria.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>
        </div>
        <p class="phase1-limit"><strong>What to know:</strong> ${escapeHtml(pathway.limit)}</p>
      </section>`;

    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function pathwayResourceHtml(resource, role) {
    const verification = verificationFor(resource);
    const phone = firstPhone(resource.phone);
    const source = safeUrl(resource.sourceUrl);
    const inPlan = state.planIds.has(String(resource.id));
    return `
      <article class="phase1-pathway-resource" data-phase1-resource-id="${escapeAttribute(resource.id)}">
        <div class="phase1-pathway-resource-heading">
          <div><span class="phase1-role-badge">${role === 'primary' ? 'Best place to start' : 'Try this next'}</span><h5>${escapeHtml(resource.name)}</h5></div>
          <span class="phase1-verification ${verification.cssClass}">${escapeHtml(verification.label)}</span>
        </div>
        <p>${escapeHtml(resource.referralTrigger)}</p>
        <dl>
          <div><dt>How to get started</dt><dd>${escapeHtml(resource.access)}</dd></div>
          <div><dt>Before you go</dt><dd>${escapeHtml(resource.caveat || 'Call or check the website for current rules and openings.')}</dd></div>
        </dl>
        <div class="card-actions">
          ${phone ? `<a class="button button-primary button-small" href="tel:${phone}">${actionLabel(resource)}</a>` : ''}
          ${source ? `<a class="button button-secondary button-small" href="${escapeAttribute(source)}" target="_blank" rel="noopener noreferrer">Visit program website</a>` : ''}
          <button class="button button-quiet button-small" type="button" data-phase1-plan-toggle="${escapeAttribute(resource.id)}">${inPlan ? 'Remove from my plan' : 'Save to my plan'}</button>
          <button class="button button-quiet button-small" type="button" data-phase1-find-resource="${escapeAttribute(resource.id)}">See full details</button>
        </div>
      </article>`;
  }

  function injectPlanPanel() {
    const mount = document.getElementById('plan-mount');
    if (!mount || document.getElementById('phase1-plan')) return;
    const panel = document.createElement('section');
    panel.id = 'phase1-plan';
    panel.className = 'phase1-plan';
    panel.innerHTML = `
      <div class="phase1-plan-heading">
        <div><p class="eyebrow">My saved programs</p><h2>Programs I want to try</h2><p>Keep track of what you want to do next. This stays in this browser, so do not add private information.</p></div>
        <div class="card-actions"><button class="button button-secondary" type="button" data-copy-plan>Copy my plan</button><button class="button button-quiet" type="button" data-print-plan>Print</button></div>
      </div>
      <div id="phase1-plan-list"></div>`;
    mount.appendChild(panel);

    renderPlan();
  }

  function renderPlan() {
    const container = document.getElementById('phase1-plan-list');
    if (!container || !state.data) return;
    const resources = [...state.planIds].map(findResource).filter(Boolean);
    updatePlanCounts(resources.length);

    if (!resources.length) {
      container.innerHTML = '<div class="phase1-plan-empty"><h3>You have not saved any programs yet</h3><p>Save a program from Find help or Browse programs, then come back here.</p></div>';
      return;
    }

    container.innerHTML = resources.map((resource) => {
      const meta = state.planMeta[String(resource.id)] || {};
      return `
        <article class="phase1-plan-item" data-plan-item="${escapeAttribute(resource.id)}">
          <div class="phase1-plan-item-main">
            <span class="phase1-role-badge">${escapeHtml(resource.pathwayRole || PATHWAY_ROLE_LABELS[resource.priority] || 'Program')}</span>
            <h3>${escapeHtml(resource.name)}</h3>
            <p>${escapeHtml(resource.referralTrigger)}</p>
            <p class="phase1-plan-action"><strong>What to do next:</strong> ${escapeHtml(actionInstruction(resource))}</p>
          </div>
          <div class="phase1-plan-fields">
            <label class="field"><span>Status</span><select data-plan-status="${escapeAttribute(resource.id)}">${STATUS_OPTIONS.map((status) => `<option ${status === (meta.status || STATUS_OPTIONS[0]) ? 'selected' : ''}>${escapeHtml(status)}</option>`).join('')}</select></label>
            <label class="field"><span>Check back on</span><input type="date" data-plan-date="${escapeAttribute(resource.id)}" value="${escapeAttribute(meta.followUp || '')}"></label>
          </div>
          <div class="card-actions">
            ${firstPhone(resource.phone) ? `<a class="button button-primary button-small" href="tel:${firstPhone(resource.phone)}">${actionLabel(resource)}</a>` : ''}
            ${safeUrl(resource.sourceUrl) ? `<a class="button button-secondary button-small" href="${escapeAttribute(safeUrl(resource.sourceUrl))}" target="_blank" rel="noopener noreferrer">Visit program website</a>` : ''}
            <button class="button button-quiet button-small" type="button" data-phase1-plan-toggle="${escapeAttribute(resource.id)}">Remove</button>
          </div>
        </article>`;
    }).join('');
  }

  function updatePlanCounts(count) {
    document.querySelectorAll('.phase1-plan-count').forEach((element) => setText(element, count));
  }

  function togglePlan(id) {
    const key = String(id);
    if (state.planIds.has(key)) {
      state.planIds.delete(key);
      delete state.planMeta[key];
    } else {
      state.planIds.add(key);
      state.planMeta[key] = state.planMeta[key] || { status: STATUS_OPTIONS[0], followUp: '' };
    }
    persistPlan();
    renderPlan();
    enhanceRenderedContent();
    document.querySelectorAll(`[data-phase1-plan-toggle="${cssEscape(key)}"]`).forEach((button) => {
      setText(button, state.planIds.has(key) ? 'Remove from my plan' : 'Save to my plan');
    });
  }

  function persistPlan() {
    const ids = [...state.planIds];
    writeJson(PLAN_KEY, ids);
    writeJson(SAVED_KEY, ids);
    writeJson(PLAN_META_KEY, state.planMeta);
  }

  function copyPlan() {
    const resources = [...state.planIds].map(findResource).filter(Boolean);
    if (!resources.length) return;
    const text = ['My plan', ''].concat(resources.flatMap((resource, index) => {
      const meta = state.planMeta[String(resource.id)] || {};
      return [
        `${index + 1}. ${resource.name}`,
        `Status: ${meta.status || STATUS_OPTIONS[0]}`,
        meta.followUp ? `Check back on: ${meta.followUp}` : '',
        `What to do next: ${actionInstruction(resource)}`,
        resource.phone ? `Phone: ${resource.phone}` : '',
        resource.sourceUrl ? `Program website: ${resource.sourceUrl}` : '',
        'Call or visit the program website to check current rules and openings.',
        ''
      ].filter(Boolean);
    })).join('\n');
    copyText(text);
  }

  function installGlobalHandlers() {
    document.addEventListener('click', (event) => {
      const planToggle = event.target.closest('[data-phase1-plan-toggle]');
      if (planToggle) {
        event.preventDefault();
        togglePlan(planToggle.dataset.phase1PlanToggle);
        return;
      }

      const legacySave = event.target.closest('[data-action="save"], [data-dialog-action="save"]');
      if (legacySave) {
        const id = legacySave.dataset.id || legacySave.closest('[data-resource-id]')?.dataset.resourceId;
        if (id) {
          event.preventDefault();
          event.stopImmediatePropagation();
          togglePlan(id);
        }
        return;
      }

      const report = event.target.closest('[data-phase1-report]');
      if (report) {
        event.preventDefault();
        openReportDialog(report.dataset.phase1Report);
        return;
      }

      const find = event.target.closest('[data-phase1-find-resource]');
      if (find) {
        event.preventDefault();
        showResourceInDirectory(find.dataset.phase1FindResource);
        return;
      }

      const view = event.target.closest('[data-open-view]');
      if (view) {
        document.querySelector(`[data-view="${cssEscape(view.dataset.openView)}"]`)?.click();
        return;
      }

      if (event.target.closest('[data-copy-plan]')) copyPlan();
      if (event.target.closest('[data-print-plan]')) window.print();

      const needsButton = event.target.closest('[data-phase1-support-area]');
      if (needsButton) {
        event.preventDefault();
        openSupportArea(needsButton.dataset.phase1SupportArea);
      }
    }, true);

    document.addEventListener('change', (event) => {
      const status = event.target.closest('[data-plan-status]');
      if (status) {
        const id = status.dataset.planStatus;
        state.planMeta[id] = state.planMeta[id] || {};
        state.planMeta[id].status = status.value;
        persistPlan();
      }
      const date = event.target.closest('[data-plan-date]');
      if (date) {
        const id = date.dataset.planDate;
        state.planMeta[id] = state.planMeta[id] || {};
        state.planMeta[id].followUp = date.value;
        persistPlan();
      }
    });
  }

  function installObservers() {
    const targets = [
      document.getElementById('resource-grid'),
      document.getElementById('dialog-content'),
      document.getElementById('needs-grid')
    ].filter(Boolean);
    if (!targets.length) return;

    let enhancementQueued = false;
    const observer = new MutationObserver(() => {
      if (enhancementQueued) return;
      enhancementQueued = true;
      requestAnimationFrame(() => {
        enhancementQueued = false;
        enhanceRenderedContent();
      });
    });

    targets.forEach((target) => observer.observe(target, { childList: true, subtree: true }));
  }

  function enhanceRenderedContent() {
    if (!state.data) return;
    enhanceCards();
    enhanceDialog();
    enhanceNeedsMap();
    updateVerificationSummary();
  }

  function enhanceCards() {
    document.querySelectorAll('.resource-card[data-resource-id]').forEach((card) => {
      const resource = findResource(card.dataset.resourceId);
      if (!resource) return;

      const priorityTag = card.querySelector('.tag-row .tag:not(.tag-foster):not(.tag-local)');
      if (priorityTag) setText(priorityTag, resource.pathwayRole);

      if (!card.querySelector('.phase1-verification')) {
        const verification = verificationFor(resource);
        card.querySelector('.tag-row')?.insertAdjacentHTML('beforeend', `<span class="phase1-verification ${verification.cssClass}">${escapeHtml(verification.label)}</span>`);
      }

      const verifiedLine = [...card.querySelectorAll('.meta-line')].find((line) => /Verified|Checked/i.test(line.textContent));
      if (verifiedLine) setText(verifiedLine.querySelector('span:last-child'), verificationFor(resource).detail);

      const details = card.querySelector('[data-action="details"]');
      if (details) setText(details, 'See how to apply');

      const save = card.querySelector('[data-action="save"]');
      if (save) {
        const inPlan = state.planIds.has(String(resource.id));
        setText(save, inPlan ? '★' : '☆');
        save.classList.toggle('is-saved', inPlan);
        save.setAttribute('aria-label', inPlan ? 'Remove from my plan' : 'Save to my plan');
        save.title = inPlan ? 'Remove from my plan' : 'Save to my plan';
      }

      const source = card.querySelector('a.button-quiet[href]');
      if (source) setText(source, 'Visit program website');

      const actions = card.querySelector('.card-actions');
      if (actions && !actions.querySelector('[data-phase1-report]')) {
        actions.insertAdjacentHTML('beforeend', `<button class="button button-quiet button-small" type="button" data-phase1-report="${escapeAttribute(resource.id)}">Report a change</button>`);
      }
    });
  }

  function enhanceDialog() {
    const dialog = document.getElementById('resource-dialog');
    const content = document.getElementById('dialog-content');
    if (!dialog?.open || !content) return;
    const id = content.querySelector('[data-dialog-action][data-id]')?.dataset.id;
    const resource = findResource(id);
    if (!resource) return;

    const priorityTag = content.querySelector('.tag-row .tag:not(.tag-foster):not(.tag-local)');
    if (priorityTag) setText(priorityTag, resource.pathwayRole);

    const save = content.querySelector('[data-dialog-action="save"]');
    if (save) setText(save, state.planIds.has(String(resource.id)) ? 'Remove from my plan' : 'Save to my plan');
    const copy = content.querySelector('[data-dialog-action="copy"]');
    if (copy) setText(copy, 'Copy program details');
    const official = content.querySelector('a.button-secondary');
    if (official) setText(official, 'Visit program website');
    const call = content.querySelector('a.button-primary[href^="tel:"]');
    if (call) setText(call, actionLabel(resource));

    if (!content.querySelector('.phase1-readiness')) {
      const details = content.querySelector('.detail-grid');
      details?.insertAdjacentHTML('afterend', readinessHtml(resource));
    }

    const actions = content.querySelector('.dialog-actions');
    if (actions && !actions.querySelector('[data-phase1-report]')) {
      actions.insertAdjacentHTML('beforeend', `<button class="button button-quiet" type="button" data-phase1-report="${escapeAttribute(resource.id)}">Report a change</button>`);
    }
  }

  function readinessHtml(resource) {
    const verification = verificationFor(resource);
    return `
      <section class="phase1-readiness">
        <h3>Before you contact this program</h3>
        <div class="phase1-readiness-grid">
          <div><strong>Where to start</strong><span>${escapeHtml(resource.pathwayRole)}</span></div>
          <div><strong>When this was checked</strong><span class="phase1-verification ${verification.cssClass}">${escapeHtml(verification.detail)}</span></div>
          <div><strong>Are they taking new people?</strong><span>${escapeHtml(resource.intakeStatus)}</span></div>
          <div><strong>How to get started</strong><span>${escapeHtml(resource.applicationMethod)}</span></div>
          <div><strong>Can I contact them myself?</strong><span>${escapeHtml(resource.referralRequirement)}</span></div>
          <div><strong>When you may hear back</strong><span>${escapeHtml(resource.expectedResponse)}</span></div>
          <div class="full"><strong>What to bring or have ready</strong><span>${escapeHtml(resource.requiredDocuments.join(' · '))}</span></div>
          <div class="full"><strong>Your next step</strong><span>${escapeHtml(actionInstruction(resource))}</span></div>
        </div>
      </section>`;
  }

  function enhanceNeedsMap() {
    document.querySelectorAll('#needs-grid .need-card').forEach((card) => {
      if (card.querySelector('[data-phase1-support-area]')) return;
      const heading = card.querySelector('h2')?.textContent || '';
      const supportArea = supportAreaFor(heading + ' ' + card.textContent);
      if (!supportArea) return;
      const actions = document.createElement('div');
      actions.className = 'card-actions phase1-needs-actions';
      actions.innerHTML = `<button class="button button-primary button-small" type="button" data-phase1-support-area="${escapeAttribute(supportArea)}">See programs that may help</button>`;
      card.appendChild(actions);
    });
  }

  function updateVerificationSummary() {
    if (!state.data) return;
    const footer = document.getElementById('verified-footer');
    if (footer) setText(footer, 'Each program shows when its information was last checked. Call or visit the program website to check current rules and openings.');

    const stats = document.querySelector('.stats-grid');
    if (!stats || document.querySelector('[data-verification-summary]')) return;
    const counts = state.data.resources.reduce((output, resource) => {
      const key = verificationFor(resource).key;
      output[key] = (output[key] || 0) + 1;
      return output;
    }, {});
    const summary = document.createElement('article');
    summary.className = 'phase1-verification-summary';
    summary.dataset.verificationSummary = 'true';
    summary.innerHTML = `<strong>How recent is this information?</strong><span>${counts.recent || 0} checked within 30 days · ${counts.current || 0} checked within 31–90 days · ${(counts.aging || 0) + (counts.stale || 0) + (counts.unverified || 0)} should be checked again</span>`;
    stats.insertAdjacentElement('afterend', summary);
  }

  function injectReportDialog() {
    if (document.getElementById('phase1-report-dialog')) return;
    const dialog = document.createElement('dialog');
    dialog.id = 'phase1-report-dialog';
    dialog.className = 'resource-dialog phase1-report-dialog';
    dialog.innerHTML = `
      <form method="dialog" id="phase1-report-form">
        <div class="dialog-title"><p class="eyebrow">Fix a listing</p><h2>Report a change</h2><p id="phase1-report-resource"></p></div>
        <input type="hidden" name="resourceId">
        <fieldset><legend>What looks wrong?</legend>
          <label class="phase1-inline-choice"><input type="radio" name="reason" value="Contact information" required> Phone, website or address</label>
          <label class="phase1-inline-choice"><input type="radio" name="reason" value="Eligibility or service description"> Who can use it or what it offers</label>
          <label class="phase1-inline-choice"><input type="radio" name="reason" value="Program closed or unavailable"> Program closed or has no openings</label>
          <label class="phase1-inline-choice"><input type="radio" name="reason" value="Other correction"> Something else</label>
        </fieldset>
        <label class="field"><span>What should be changed?</span><textarea name="details" rows="4" maxlength="800" placeholder="Tell us what changed. Do not include your name, health information or other private details."></textarea></label>
        <p class="phase1-privacy-note">This opens a public report. Do not include your name, health information or other private details.</p>
        <div class="dialog-actions"><button class="button button-primary" value="submit" type="submit">Send correction</button><button class="button button-quiet" value="cancel" type="button" data-close-report>Cancel</button></div>
      </form>`;
    document.body.appendChild(dialog);

    dialog.querySelector('[data-close-report]').addEventListener('click', () => dialog.close());
    dialog.querySelector('form').addEventListener('submit', submitCorrection);
  }

  function openReportDialog(id) {
    const resource = findResource(id);
    const dialog = document.getElementById('phase1-report-dialog');
    if (!resource || !dialog) return;
    dialog.querySelector('form').reset();
    dialog.querySelector('[name="resourceId"]').value = resource.id;
    dialog.querySelector('#phase1-report-resource').textContent = resource.name;
    dialog.showModal();
  }

  function submitCorrection(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const resource = findResource(form.get('resourceId'));
    if (!resource) return;
    const reason = String(form.get('reason') || 'Other correction');
    const details = String(form.get('details') || '').trim();
    const title = `Resource correction: ${resource.name}`;
    const body = [
      `## Resource`, resource.name,
      '', `## Type of correction`, reason,
      '', `## Details`, details || 'No additional details provided.',
      '', `## Listing source`, resource.sourceUrl || 'No source URL recorded.',
      '', `## Privacy reminder`, 'No personal information is included in this report.'
    ].join('\n');
    const url = `${CONFIG.feedbackUrl}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    document.getElementById('phase1-report-dialog').close();
  }

  function openSupportArea(supportArea) {
    document.querySelector('[data-view="directory"]')?.click();
    const select = document.getElementById('support-filter');
    if (select && [...select.options].some((option) => option.value === supportArea)) {
      select.value = supportArea;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    document.getElementById('directory-browser')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showResourceInDirectory(id) {
    const resource = findResource(id);
    if (!resource) return;
    document.querySelector('[data-view="directory"]')?.click();
    const search = document.getElementById('search-input');
    if (search) {
      search.value = resource.name;
      search.dispatchEvent(new Event('input', { bubbles: true }));
    }
    setTimeout(() => document.getElementById('directory-browser')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 180);
  }

  function verificationFor(resource) {
    if (resource.priority === 'Verify' || !resource.lastVerified) {
      return { key: 'unverified', label: 'Check before you go', detail: 'Call or check the website before making plans', cssClass: 'is-stale' };
    }
    const checked = new Date(`${String(resource.lastVerified).slice(0, 10)}T12:00:00`);
    const days = Number.isNaN(checked.getTime()) ? Infinity : Math.max(0, Math.floor((Date.now() - checked.getTime()) / 86400000));
    const date = formatDate(resource.lastVerified);
    if (days <= CONFIG.verificationFreshDays) return { key: 'recent', label: 'Recently checked', detail: `Checked ${date}`, cssClass: 'is-recent' };
    if (days <= CONFIG.verificationCurrentDays) return { key: 'current', label: 'Checked', detail: `Checked ${date}`, cssClass: 'is-current' };
    if (days <= CONFIG.verificationAgingDays) return { key: 'aging', label: 'Check for openings', detail: `Last checked ${date}`, cssClass: 'is-aging' };
    return { key: 'stale', label: 'Check before you go', detail: `Last checked ${date}`, cssClass: 'is-stale' };
  }

  function inferIntakeStatus(resource) {
    const text = normalize(`${resource.caveat} ${resource.access}`);
    if (/closed|not accepting|no longer accepting/.test(text)) return 'May be closed or not taking new people — call first';
    if (/waitlist|waiting list/.test(text)) return 'May have a waiting list or depend on openings — call first';
    if (/funding.*exhausted|funds.*unavailable/.test(text)) return 'Money may not be available — ask first';
    if (/24\/7|24 hours/.test(text)) return 'Available 24 hours a day';
    return 'Not listed — call and ask';
  }

  function inferApplicationMethod(resource) {
    const text = normalize(resource.access);
    const methods = [];
    if (/call|phone/.test(text) || resource.phone) methods.push('Call');
    if (/online|website|application|apply/.test(text) && resource.sourceUrl) methods.push('Online');
    if (/walk.?in|visit|in person/.test(text)) methods.push('In person');
    if (/referral/.test(text)) methods.push('A partner organization may need to apply with you');
    return methods.length ? [...new Set(methods)].join(' or ') : 'Call the program and ask';
  }

  function inferReferralRequirement(resource) {
    const text = normalize(`${resource.access} ${resource.eligibility} ${resource.notes}`);
    if (/referral only|must be referred|referring worker/.test(text)) return 'No — a partner organization must apply with you';
    if (/self.?referral|call directly|apply directly/.test(text)) return 'Yes — you can contact the program yourself';
    return 'Not clear — call and ask';
  }

  function inferDocuments(resource) {
    const text = normalize(`${resource.access} ${resource.eligibility} ${resource.notes}`);
    const documents = [];
    if (/\bid\b|identification|driver.?s license|birth certificate/.test(text)) documents.push('Photo ID or other identification, if you have it');
    if (/income|pay stub|benefit letter/.test(text)) documents.push('Information about your income or benefits');
    if (/eviction|lease|homelessness verification|housing notice/.test(text)) documents.push('Lease, move-out notice or other proof of your housing situation');
    if (/insurance|medicaid/.test(text)) documents.push('Insurance or Medicaid information');
    if (/application/.test(text)) documents.push('Any application you have already started');
    if (!documents.length) documents.push('Call and ask what you should bring or have ready');
    return documents;
  }

  function inferExpectedResponse(resource) {
    const text = `${resource.caveat || ''} ${resource.access || ''}`;
    const match = text.match(/(?:within|up to|approximately|about)\s+([^.]*?(?:business )?(?:hour|hours|day|days|week|weeks))/i);
    return match ? match[0].replace(/^./, (char) => char.toUpperCase()) : 'Not listed — ask when to check back';
  }

  function actionInstruction(resource) {
    const method = inferApplicationMethod(resource);
    if (method.includes('partner organization')) return 'Call the program and ask which partner organization can apply with you and what information they need.';
    if (method.includes('Call')) return `Call ${resource.phone || 'the program'} and ask whether you qualify, whether there are openings, what to bring and what happens next.`;
    if (method.includes('Online')) return 'Visit the program website, check who can apply and follow the application steps.';
    if (method.includes('In person')) return 'Call before going to check the hours and what you should bring.';
    return 'Contact the program and ask how to get started and whether it has openings.';
  }

  function actionLabel(resource) {
    const method = inferApplicationMethod(resource);
    if (method.includes('partner organization')) return 'Call to ask how to apply';
    if (method.includes('Call')) return 'Call the program';
    return 'Call';
  }

  function supportAreaFor(text) {
    const match = NEED_SUPPORT_MAP.find(([pattern]) => pattern.test(text));
    return match ? match[1] : '';
  }

  function resourceList(ids) {
    return (ids || []).map(findResource).filter(Boolean);
  }

  function findResource(id) {
    return state.data?.resources?.find((resource) => String(resource.id) === String(id));
  }

  function firstPhone(value) {
    if (!value) return '';
    const digits = String(value).split(/[\/|]/)[0].replace(/[^0-9]/g, '');
    if (digits.length === 3) return digits;
    if (digits.startsWith('1') && digits.length >= 11) return digits.slice(0, 11);
    return digits.length >= 10 ? digits.slice(0, 10) : '';
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
    if (!value) return 'date not available';
    const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  }


  function setText(element, value) {
    if (element && element.textContent !== String(value)) element.textContent = String(value);
  }

  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function readJson(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage can be unavailable. */ }
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else fallbackCopy(text);
  }

  function fallbackCopy(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }

  function cssEscape(value) {
    return window.CSS?.escape ? CSS.escape(String(value)) : String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
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
})();
