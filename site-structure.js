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
      plan.innerHTML = 'My plan <span class="phase1-plan-count" aria-label="programs in plan">0</span>';
      plan.addEventListener('click', () => activateView('needs'));
      const urgent = actions.querySelector('[data-urgent-jump]');
      urgent?.insertAdjacentElement('afterend', plan);
    }
  }

  function restructureNavigation() {
    setText('.nav-tab[data-view="directory"]', 'Browse programs');
    setText('.nav-tab[data-view="urgent"]', 'Find help');
    setText('.nav-tab[data-view="foster"]', 'Help after foster care');
    setText('.nav-tab[data-view="about"]', 'About');

    const needs = document.querySelector('.nav-tab[data-view="needs"]');
    if (needs) {
      needs.textContent = 'My plan';
      needs.hidden = true;
    }
  }

  function restructureDirectory() {
    setText('#view-directory .hero .eyebrow', 'Help for young adults in the Charlotte area');
    setText('#view-directory .hero h1', 'Find help with what you need');
    setText('#view-directory .hero-copy', 'Search local programs for housing, food, jobs, school, healthcare, transportation, legal help, mentoring and other everyday needs.');

    const note = document.querySelector('#view-directory .hero-note');
    if (note) {
      note.innerHTML = '<strong>Check before you go.</strong><p>Programs can change their rules, hours, costs and openings. Call or visit the program website to make sure it can help you now.</p>';
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
    setText('#view-urgent .page-heading h1', 'Find a good next step');
    setText('#view-urgent .page-heading p:last-child', 'Answer a few simple questions to see a smaller list of programs that may fit. You will not be asked for your name or private details.');

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
        sectionHeading.innerHTML = '<p class="eyebrow">Help right now</p><h2>Use these options when it may not be safe to wait</h2>';
        urgentContainer.prepend(sectionHeading);
      }

      const banner = urgentContainer.querySelector('.emergency-banner');
      if (banner) {
        banner.innerHTML = '<div><strong>Are you in immediate danger, badly hurt or dealing with an overdose?</strong><p>Call 911. If you may hurt yourself or need someone to talk to right now, call or text 988.</p></div><div class="card-actions"><a class="button button-danger" href="tel:911">Call 911</a><a class="button button-primary" href="tel:988">Call or text 988</a></div>';
      }
    }
  }

  function restructurePlan() {
    const view = document.getElementById('view-needs');
    if (!view) return;

    setText('#view-needs .page-heading .eyebrow', 'Saved only in this browser');
    setText('#view-needs .page-heading h1', 'My plan');
    setText('#view-needs .page-heading p:last-child', 'Save programs you want to try and keep track of your next step. Do not enter names, health details or other private information here.');

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
    setText('#view-foster .page-heading .eyebrow', 'Extra help you may qualify for');
    setText('#view-foster .page-heading h1', 'Help after foster care');
    setText('#view-foster .page-heading p:last-child', 'You may be able to get help with housing, school, healthcare and living on your own because you were in foster care. Some programs have age deadlines, so check them as soon as you can.');
  }

  function restructureAbout() {
    const grid = document.querySelector('#view-about .about-grid');
    if (!grid) return;

    setText('#view-about .page-heading .eyebrow', 'About this website');
    setText('#view-about .page-heading h1', 'How this directory works');
    setText('#view-about .page-heading p:last-child', 'Learn what is included, how information is checked and how to tell us when something has changed.');

    grid.classList.add('about-sections');
    grid.innerHTML = `
      <section class="about-section">
        <h2>How to use it</h2>
        <p>This directory is made for young adults looking for help in Charlotte, Mecklenburg County and nearby communities.</p>
        <p>Use <strong>Browse programs</strong> when you know what kind of help you need. Use <strong>Find help</strong> when the situation is urgent or you are not sure where to begin. Save useful programs to <strong>My plan</strong>.</p>
      </section>
      <section class="about-section">
        <h2>What is included</h2>
        <p>We include government programs, schools, healthcare systems and established nonprofit organizations that explain what they offer and how to get started.</p>
        <p>“Local or nearby” usually means Charlotte, Mecklenburg County or a community within about 30 miles of Uptown Charlotte. Always check whether a program serves your county or ZIP code.</p>
      </section>
      <section class="about-section">
        <h2>What to check</h2>
        <p>A listing does not promise that a program will have an opening or that you will qualify. Rules, hours, costs, funding and contact information can change.</p>
        <div id="verification-summary-mount"></div>
        <p>Each program shows when its information was last checked. Call or visit the program website before making plans.</p>
      </section>
      <section class="about-section">
        <h2>Tell us about a change</h2>
        <p>Use <strong>Report outdated information</strong> on a program page when something looks wrong. Do not include your name, health information or other private details in the report.</p>
        <p>The spreadsheet below contains the information used to maintain this directory.</p>
        <a class="button button-primary" href="/source/Charlotte_Young_Adult_Resource_Directory.xlsx" download>Download the program list</a>
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
