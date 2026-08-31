(() => {
  'use strict';

  const LABELS = new Map([
    ['Directory', 'Browse programs'],
    ['Browse resources', 'Browse programs'],
    ['Get help', 'Find help'],
    ['Foster care', 'Help after foster care'],
    ['Best for', 'This may help if'],
    ['Age / eligibility', 'Who can use this'],
    ['What it provides', 'How it can help'],
    ['How to access', 'How to get started'],
    ['Location / service area', 'Location and areas served'],
    ['Support areas', 'Types of help'],
    ['Local-area note', 'Where it is available'],
    ['Capacity / verification caveat', 'What to check first'],
    ['Last verified', 'Information last checked'],
    ['View details', 'See how to apply'],
    ['Official source', 'Visit program website'],
    ['Open official source', 'Visit program website'],
    ['Copy referral summary', 'Copy program details'],
    ['Save resource', 'Save program'],
    ['Remove saved resource', 'Remove saved program'],
    ['First action', 'Start here'],
    ['Backup / next step', 'Another option'],
    ['Important limit', 'What to know'],
    ['Age window', 'Age range'],
    ['Eligibility trigger', 'Who can use it'],
    ['Primary value', 'How it can help'],
    ['Recommended next step', 'What to do next'],
    ['Source', 'Program website'],
    ['Primary options', 'Good places to start'],
    ['Backup / specialist options', 'Other options'],
    ['Referral strategy', 'What to do next'],
    ['Core', 'Best place to start'],
    ['Specialized', 'For a specific need'],
    ['Backup', 'Try this next'],
    ['Foster-care specific', 'Made for people with foster care experience'],
    ['Youth / foster relevant', 'May help after foster care'],
    ['Youth / partially specific', 'May help after foster care'],
    ['General community resource', 'Open to the wider community'],
    ['Recently verified', 'Recently checked'],
    ['Official page', 'Program website']
  ]);

  const SUPPORT_LABELS = new Map([
    ['Housing / homelessness', 'Housing and a safe place to stay'],
    ['Food / essentials', 'Food and basic needs'],
    ['Employment / workforce', 'Jobs and career help'],
    ['Soft skills / life skills', 'Everyday and work skills'],
    ['Financial capability', 'Money and budgeting'],
    ['Community / belonging', 'Mentoring and connection'],
    ['Mental health / recovery', 'Mental health and recovery'],
    ['Legal / identity / safety', 'Legal help, IDs and safety'],
    ['Health care', 'Healthcare']
  ]);

  const PHRASES = [
    [/\bcase management\b/gi, 'help making a plan and finding services'],
    [/\bcase managers?\b/gi, 'support people'],
    [/\bsocial workers?\b/gi, 'support people'],
    [/\breferring worker\b/gi, 'person helping you'],
    [/\bprofessional referral\b/gi, 'application through a partner organization'],
    [/\bself-referral\b/gi, 'contacting the program yourself'],
    [/\breferral-only\b/gi, 'requires a partner organization to apply with you'],
    [/\breferral only\b/gi, 'requires a partner organization to apply with you'],
    [/\breferral process\b/gi, 'steps to get connected'],
    [/\breferral pathway\b/gi, 'way to get connected'],
    [/\bsubmit(?:ted)? a referral\b/gi, 'send your information to the program'],
    [/\baccept a referral\b/gi, 'accept an application'],
    [/\breferral outcome\b/gi, 'result'],
    [/\bunresolved referrals\b/gi, 'programs you are still waiting on'],
    [/\breferrals\b/gi, 'applications'],
    [/\breferral\b/gi, 'application'],
    [/\bintake process\b/gi, 'steps to get started'],
    [/\bintake orientation\b/gi, 'first meeting'],
    [/\bintake\b/gi, 'sign-up'],
    [/\beligibility requirements\b/gi, 'rules for who can use the program'],
    [/\beligibility\b/gi, 'who can use the program'],
    [/\bservice capacity\b/gi, 'openings'],
    [/\btreatment capacity\b/gi, 'open appointments'],
    [/\bcapacity\b/gi, 'openings'],
    [/\bservice areas?\b/gi, 'areas served'],
    [/\bproviders\b/gi, 'programs'],
    [/\bprovider\b/gi, 'program'],
    [/\bbehavioral health\b/gi, 'mental health and substance use support'],
    [/\bsubstance use disorders?\b/gi, 'drug or alcohol recovery needs'],
    [/\bhousing instability\b/gi, 'risk of losing housing'],
    [/\bat risk of homelessness\b/gi, 'at risk of losing housing'],
    [/\bexperiencing homelessness\b/gi, 'without a safe, stable place to stay'],
    [/\bhomelessness verification\b/gi, 'proof of your housing situation'],
    [/\bscreening or assessment\b/gi, 'first conversation'],
    [/\bscreening\b/gi, 'first questions'],
    [/\bassessment\b/gi, 'first meeting'],
    [/\bclinical assessment\b/gi, 'meeting to understand what help you need'],
    [/\btrauma-informed\b/gi, 'designed with an understanding of hard life experiences'],
    [/\bcustody-status\b/gi, 'foster care history'],
    [/\bcustody status\b/gi, 'foster care history'],
    [/\btransition services\b/gi, 'help after foster care'],
    [/\bindependent-living\b/gi, 'living-on-your-own'],
    [/\bindependent living\b/gi, 'living on your own'],
    [/\bself-sufficiency\b/gi, 'living on your own'],
    [/\bworkforce development\b/gi, 'job and career help'],
    [/\bworkforce\b/gi, 'jobs and career help'],
    [/\bfinancial capability\b/gi, 'money and budgeting'],
    [/\bsoft skills\b/gi, 'work and communication skills'],
    [/\bcommunity \/ belonging\b/gi, 'mentoring and connection'],
    [/\blegal \/ identity \/ safety\b/gi, 'legal help, IDs and safety'],
    [/\bmental health \/ recovery\b/gi, 'mental health and recovery'],
    [/\bfunding may be unavailable\b/gi, 'money for the program may not be available'],
    [/\bfunding\b/gi, 'money available'],
    [/\bcohort\b/gi, 'class'],
    [/\badministrative burden\b/gi, 'extra paperwork and calls'],
    [/\bentry point\b/gi, 'place to start'],
    [/\bnavigation\b/gi, 'help finding programs'],
    [/\bnot published\b/gi, 'not listed'],
    [/\bvacancy dependent\b/gi, 'depends on openings'],
    [/\bcontinuous intake\b/gi, 'available around the clock'],
    [/\bformal notice\b/gi, 'written notice'],
    [/\bcounty residency\b/gi, 'proof that you live in the county'],
    [/\bcoordinated entry\b/gi, 'Coordinated Entry, the county housing-help system'],
    [/\bcoordinated assessment\b/gi, 'Coordinated Assessment, the county housing-help system'],
    [/\bcurrent or former foster youth\b/gi, 'people who are or were in foster care'],
    [/\bfoster youth\b/gi, 'people in or formerly in foster care'],
    [/\byoung adults? ages?\b/gi, 'people ages'],
    [/\byoung adults? who\b/gi, 'people who'],
    [/\bfor young adults?\b/gi, 'for you'],
    [/\bthe young adult\b/gi, 'you'],
    [/\ba young adult\b/gi, 'you']
  ];

  function onReady(callback) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', callback, { once: true });
    else callback();
  }

  function setLeafText(element, value) {
    if (!element || element.textContent.trim() === String(value)) return;
    if (element.childNodes.length === 1 && element.firstChild?.nodeType === Node.TEXT_NODE) {
      element.firstChild.data = String(value);
    }
  }

  function setText(selector, value) {
    setLeafText(document.querySelector(selector), value);
  }

  function updateStaticLanguage() {
    setText('.brand small', 'Find help in the Charlotte area');
    setText('.nav-tab[data-view="directory"]', 'Browse programs');
    setText('.nav-tab[data-view="urgent"]', 'Find help');
    setText('.nav-tab[data-view="foster"]', 'Help after foster care');

    const search = document.getElementById('search-input');
    if (search) search.placeholder = 'Try housing, jobs, food, counseling or GED';

    setText('.filter-heading h2', 'Narrow your results');
    setText('#view-directory .hero .eyebrow', 'Help for young adults in the Charlotte area');
    setText('#view-directory .hero h1', 'Find help with what you need');
    setText('#view-directory .hero-copy', 'Search local programs for housing, food, jobs, school, healthcare, transportation, legal help, mentoring and other everyday needs.');

    updateOption('#sort-select', 'recommended', 'Where to start');
    updateOption('#sort-select', 'verified', 'Recently checked');
    updateOption('#priority-filter', 'all', 'All starting points');
    updateOption('#priority-filter', 'Core', 'Best place to start');
    updateOption('#priority-filter', 'Specialized', 'For a specific need');
    updateOption('#priority-filter', 'Backup', 'Try this next');
    updateOption('#foster-filter', 'yes', 'Made for people with foster care experience');
    updateOption('#foster-filter', 'partial', 'May help after foster care');
    updateOption('#foster-filter', 'no', 'Open to the wider community');

    const supportSelect = document.getElementById('support-filter');
    if (supportSelect) {
      [...supportSelect.options].forEach((option) => {
        const replacement = SUPPORT_LABELS.get(option.textContent.trim());
        if (replacement) setLeafText(option, replacement);
      });
    }
  }

  function updateOption(selector, value, text) {
    const select = document.querySelector(selector);
    const option = select ? [...select.options].find((item) => item.value === value) : null;
    setLeafText(option, text);
  }

  function replaceLabels() {
    document.querySelectorAll('h1, h2, h3, h4, h5, p, span, strong, small, dt, th, button, a, legend, label, option').forEach((element) => {
      if (element.children.length || element.childNodes.length !== 1) return;
      const current = element.textContent.trim();
      const replacement = LABELS.get(current) || SUPPORT_LABELS.get(current);
      if (replacement) setLeafText(element, replacement);
    });
  }

  function plainify(value) {
    let output = String(value || '');
    PHRASES.forEach(([pattern, replacement]) => {
      output = output.replace(pattern, replacement);
    });
    return output
      .replace(/\bYou needs\b/g, 'You need')
      .replace(/\byou needs\b/g, 'you need')
      .replace(/\bYou is\b/g, 'You are')
      .replace(/\byou is\b/g, 'you are')
      .replace(/\bYou has\b/g, 'You have')
      .replace(/\byou has\b/g, 'you have')
      .replace(/\bYou wants\b/g, 'You want')
      .replace(/\byou wants\b/g, 'you want')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function rewriteProgramText() {
    const selectors = [
      '.resource-card .trigger',
      '.resource-card .caveat',
      '#resource-dialog .detail-block p',
      '.phase1-pathway-resource > p',
      '.phase1-pathway-resource dd',
      '.phase1-plan-item-main > p:not(.phase1-plan-action)',
      '.triage-detail p',
      '.need-section p',
      '#foster-table td'
    ];

    document.querySelectorAll(selectors.join(',')).forEach((element) => {
      if (element.children.length || element.childNodes.length !== 1) return;
      const source = element.dataset.plainLanguageSource || element.textContent;
      element.dataset.plainLanguageSource = source;
      setLeafText(element, plainify(source));
    });
  }

  function rewriteTriageHeadings() {
    const headings = new Map([
      ['Suicidal thoughts or acute mental-health crisis', 'You may hurt yourself or need someone to talk to right now'],
      ['Homeless tonight or unsafe place to sleep', 'You do not have a safe place to sleep tonight'],
      ['Former foster youth under 21', 'You were in foster care and are under 21'],
      ['Ages 16–24 with several practical needs', 'You are 16–24 and need help with several things'],
      ['No food or basic household items', 'You need food or basic household items'],
      ['Young adult wants counseling or emotional support related to sexuality, relationships, or identity', 'You want counseling or emotional support about identity, relationships or sexuality']
    ]);

    document.querySelectorAll('.triage-card h2').forEach((heading) => {
      const replacement = headings.get(heading.textContent.trim());
      if (replacement) setLeafText(heading, replacement);
    });
  }

  function rewriteAttributes() {
    document.querySelectorAll('[data-action="save"]').forEach((button) => {
      const saved = button.classList.contains('is-saved');
      button.setAttribute('aria-label', saved ? 'Remove from my plan' : 'Save to my plan');
      button.title = saved ? 'Remove from my plan' : 'Save to my plan';
    });
  }

  function copyFriendlyProgramDetails() {
    const content = document.getElementById('dialog-content');
    if (!content) return;
    const lines = [content.querySelector('h2')?.textContent || 'Program details', ''];
    content.querySelectorAll('.detail-block').forEach((block) => {
      const heading = block.querySelector('h3')?.textContent.trim();
      const body = block.querySelector('p')?.textContent.trim();
      if (heading && body) lines.push(`${heading}: ${body}`);
    });
    const phone = content.querySelector('a[href^="tel:"]')?.href.replace('tel:', '');
    const website = content.querySelector('a[href^="http"]')?.href;
    if (phone) lines.push(`Phone: ${phone}`);
    if (website) lines.push(`Program website: ${website}`);
    copyText(lines.join('\n'));
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

  function installCopyOverride() {
    window.addEventListener('click', (event) => {
      const copy = event.target.closest('[data-dialog-action="copy"]');
      if (!copy) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      copyFriendlyProgramDetails();
    }, true);
  }

  let queued = false;
  function applyLanguage() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      updateStaticLanguage();
      replaceLabels();
      rewriteProgramText();
      rewriteTriageHeadings();
      rewriteAttributes();
    });
  }

  function init() {
    installCopyOverride();
    applyLanguage();
    new MutationObserver(applyLanguage).observe(document.body, { childList: true, subtree: true });
  }

  onReady(init);
})();
