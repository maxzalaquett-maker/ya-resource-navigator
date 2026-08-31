(() => {
  'use strict';

  function onReady(callback) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', callback, { once: true });
    else callback();
  }

  function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  }

  function activateView(view) {
    document.querySelector(`.nav-tab[data-view="${view}"]`)?.click();
  }

  function addHeaderUtilities() {
    const actions = document.querySelector('.header-actions');
    if (!actions) return;

    if (!actions.querySelector('[data-urgent-jump]')) {
      const urgent = document.createElement('button');
      urgent.type = 'button';
      urgent.className = 'button button-quiet header-utility header-urgent';
      urgent.dataset.urgentJump = 'true';
      urgent.textContent = 'Urgent help';
      urgent.addEventListener('click', () => {
        activateView('urgent');
        window.setTimeout(() => document.getElementById('urgent-support')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
      });
      actions.prepend(urgent);
    }

    if (!actions.querySelector('[data-plan-jump]')) {
      const plan = document.createElement('button');
      plan.type = 'button';
      plan.className = 'button button-quiet header-utility';
      plan.dataset.planJump = 'true';
      plan.innerHTML = 'My plan <span class="phase1-plan-count" aria-label="resources in plan">0</span>';
      plan.addEventListener('click', () => activateView('needs'));
      const urgent = actions.querySelector('[data-urgent-jump]');
      urgent?.insertAdjacentElement('afterend', plan);
    }
  }

  function restructureNavigation() {
    setText('.nav-tab[data-view="directory"]', 'Browse resources');
    setText('.nav-tab[data-view="urgent"]', 'Get help');
    setText('.nav-tab[data-view="foster"]', 'Foster care');
    setText('.nav-tab[data-view="about"]', 'About');

    const needs = document.querySelector('.nav-tab[data-view="needs"]');
    if (needs) {
      needs.textContent = 'My plan';
      needs.hidden = true;
    }
  }

  function restructureDirectory() {
    setText('#view-directory .hero .eyebrow', 'Charlotte-area resource directory');
    setText('#view-directory .hero h1', 'Browse resources');
    setText('#view-directory .hero-copy', 'Search and filter programs for housing, food, work, education, healthcare, transportation, legal help, mentoring and other practical needs.');

    const note = document.querySelector('#view-directory .hero-note');
    if (note) {
      note.innerHTML = '<strong>Confirm before relying on a listing.</strong><p>Eligibility, capacity, funding and intake can change. Check the program details and contact the provider directly.</p>';
    }

    const stats = document.querySelector('#view-directory .stats-grid');
    if (stats) {
      stats.hidden = true;
      stats.setAttribute('aria-hidden', 'true');
    }

    document.querySelector('#view-directory .filter-tip')?.remove();
  }

  function restructureHelp() {
    const view = document.getElementById('view-urgent');
    if (!view) return;

    setText('#view-urgent .page-heading .eyebrow', 'Not sure where to start?');
    setText('#view-urgent .page-heading h1', 'Get help finding a next step');
    setText('#view-urgent .page-heading p:last-child', 'Answer a few non-identifying questions for a smaller set of likely starting points. Immediate and crisis resources are listed below.');

    const heading = view.querySelector('.page-heading');
    if (heading && !document.getElementById('guided-pathway-mount')) {
      const mount = document.createElement('div');
      mount.id = 'guided-pathway-mount';
      mount.className = 'shell narrow guided-pathway-mount';
      heading.insertAdjacentElement('afterend', mount);
    }

    const urgentContainer = view.querySelector('.shell.narrow:not(.page-heading):not(.guided-pathway-mount)');
    if (urgentContainer) {
      urgentContainer.id = 'urgent-support';
      urgentContainer.classList.add('urgent-support-section');

      if (!urgentContainer.querySelector('.help-section-heading')) {
        const sectionHeading = document.createElement('div');
        sectionHeading.className = 'help-section-heading';
        sectionHeading.innerHTML = '<p class="eyebrow">Immediate and urgent support</p><h2>Start here when waiting could make the situation less safe</h2>';
        urgentContainer.prepend(sectionHeading);
      }

      const banner = urgentContainer.querySelector('.emergency-banner');
      if (banner) {
        banner.innerHTML = '<div><strong>Immediate danger, overdose, violence or serious injury?</strong><p>Call 911. For a suicide or mental-health crisis, call or text 988.</p></div><div class="card-actions"><a class="button button-danger" href="tel:911">Call 911</a><a class="button button-primary" href="tel:988">Call or text 988</a></div>';
      }
    }
  }

  function restructurePlan() {
    const view = document.getElementById('view-needs');
    if (!view) return;

    setText('#view-needs .page-heading .eyebrow', 'Stored only on this device');
    setText('#view-needs .page-heading h1', 'My support plan');
    setText('#view-needs .page-heading p:last-child', 'Keep track of programs, next actions and follow-up dates without entering names or private case notes.');

    const heading = view.querySelector('.page-heading');
    if (heading && !document.getElementById('plan-mount')) {
      const mount = document.createElement('div');
      mount.id = 'plan-mount';
      mount.className = 'shell narrow plan-mount';
      heading.insertAdjacentElement('afterend', mount);
    }

    const needsGrid = document.getElementById('needs-grid');
    if (needsGrid) {
      needsGrid.hidden = true;
      needsGrid.setAttribute('aria-hidden', 'true');
    }
  }

  function restructureFosterCare() {
    setText('#view-foster .page-heading .eyebrow', 'Time-sensitive transition support');
    setText('#view-foster .page-heading h1', 'Foster care benefits and deadlines');
    setText('#view-foster .page-heading p:last-child', 'Review programs with age, custody-status or enrollment deadlines before benefits expire, then confirm the recommended next step with the responsible agency.');
  }

  function restructureAbout() {
    const grid = document.querySelector('#view-about .about-grid');
    if (!grid) return;

    setText('#view-about .page-heading .eyebrow', 'How the navigator works');
    setText('#view-about .page-heading h1', 'About this resource navigator');
    setText('#view-about .page-heading p:last-child', 'Understand who the directory is for, how programs are selected, what verification means and how to report a correction.');

    grid.classList.add('about-sections');
    grid.innerHTML = `
      <section class="about-section">
        <h2>How to use the directory</h2>
        <p>Young adults can use the directory directly. It can also support social workers, case managers, mentors, foster families, churches and other community members helping someone find a practical next step.</p>
        <p><strong>Browse resources</strong> when you know the type of help needed. Use <strong>Get help</strong> when the situation is urgent or the right starting point is unclear. Save useful programs to <strong>My plan</strong> for follow-through.</p>
      </section>
      <section class="about-section">
        <h2>How resources are selected</h2>
        <p>The directory prioritizes government agencies, public institutions, established health systems and established nonprofit providers with a defined service or intake process. It excludes informal aid, crowd-sourced listings without a primary source and organizations without a clear way to request service.</p>
        <p>“Local or nearby” generally means Charlotte, Mecklenburg County or a community within roughly 30 road miles of Uptown Charlotte. County, ZIP-code and residency rules still need direct confirmation.</p>
      </section>
      <section class="about-section">
        <h2>Verification and limitations</h2>
        <p>Inclusion is not an endorsement or a guarantee that a program will accept a referral, have openings, provide funding or determine someone eligible. Listings are checked periodically, but programs can change between reviews.</p>
        <div id="verification-summary-mount"></div>
        <p>Each program detail shows its own verification date and what should be confirmed directly before relying on the listing.</p>
      </section>
      <section class="about-section">
        <h2>Data and corrections</h2>
        <p>Use <strong>Report outdated information</strong> from a program’s detail view to suggest a correction. Do not include names, health information or case details in a public correction report.</p>
        <p>The researched workbook includes the source data and operating notes used to maintain the directory.</p>
        <a class="button button-primary" href="/source/Charlotte_Young_Adult_Resource_Directory.xlsx" download>Download spreadsheet</a>
      </section>`;
  }

  function relocateVerificationSummary() {
    const mount = document.getElementById('verification-summary-mount');
    const summary = document.querySelector('[data-verification-summary]');
    if (mount && summary && summary.parentNode !== mount) mount.appendChild(summary);
  }

  function init() {
    restructureNavigation();
    restructureDirectory();
    restructureHelp();
    restructurePlan();
    restructureFosterCare();
    restructureAbout();
    addHeaderUtilities();
    relocateVerificationSummary();

    const observer = new MutationObserver(relocateVerificationSummary);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  onReady(init);
})();
