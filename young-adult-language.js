(() => {
  'use strict';

  const EXACT_TEXT = new Map([
    ['Directory', 'Browse programs'],
    ['Browse resources', 'Browse programs'],
    ['Get help', 'Find help'],
    ['Foster care', 'Help after foster care'],
    ['Guided resource pathway', 'Answer a few questions'],
    ['Get a smaller, more useful set of options', 'Find a good place to start'],
    ['No name, birth date, address or case history is requested or stored.', 'You will not be asked for your name, birth date, address or private history.'],
    ['Browse all resources', 'Browse all programs'],
    ['1. What best describes the situation?', '1. What do you need help with?'],
    ['A safe place is needed tonight', 'I need a safe place tonight'],
    ['Housing is unavailable or the current place is not safe.', 'I do not have a safe place to sleep tonight.'],
    ['Housing may end soon', 'I may lose my housing soon'],
    ['A move-out, eviction, discharge or other housing deadline is approaching.', 'I may have to leave where I am staying soon.'],
    ['Several or another kind of need', 'I need help with more than one thing'],
    ['It is hard to know which program or practical need to address first.', 'I am not sure what to handle first.'],
    ['2. How quickly is action needed?', '2. How soon do you need help?'],
    ['Immediate danger or crisis', 'I need help right now'],
    ['Use emergency or crisis support now.', 'Waiting may not be safe.'],
    ['A deadline or loss of stability is approaching.', 'Something important may change very soon.'],
    ['Planning ahead', 'I am planning ahead'],
    ['The need is important but not immediate.', 'I have some time to figure out my next step.'],
    ['3. A few eligibility clues', '3. A little more about you'],
    ['County or service area', 'Where do you live?'],
    ['Foster-care history', 'Have you ever been in foster care?'],
    ['Show likely next steps', 'Show my next steps'],
    ['Choose the main situation and how quickly action is needed.', 'Choose what you need help with and how soon you need it.'],
    ['Immediate safety', 'Help right now'],
    ['Use emergency or crisis support now', 'Get help right now'],
    ['See other urgent resources', 'See more urgent help'],
    ['The guided pathway is unavailable. Browse the full directory instead.', 'These questions are not available right now. Browse all programs instead.'],
    ['Suggested pathway', 'A good place to start'],
    ['Prepare before contacting', 'Have these ready'],
    ['What a useful result looks like', 'What to ask for'],
    ['Before relying on it', 'Before you go'],
    ['Follow-through workspace', 'My saved programs'],
    ['Saved programs and next actions', 'Programs I want to try'],
    ['Track a status and follow-up date without entering names or private case notes.', 'Keep track of what you want to try next. This stays in this browser, so do not add private information.'],
    ['Copy plan', 'Copy my plan'],
    ['No programs added yet', 'You have not saved any programs yet'],
    ['Add programs from Get help or Browse resources, then return here to track the next step.', 'Save a program from Find help or Browse programs, then come back here.'],
    ['Planning to contact', 'Want to contact'],
    ['Contacted', 'Called or messaged'],
    ['Application started', 'Started the application'],
    ['Waiting for response', 'Waiting to hear back'],
    ['Connected to service', 'Got help'],
    ['Not eligible', 'Did not qualify'],
    ['No availability', 'No openings'],
    ['Need another option', 'Try another option'],
    ['Next action:', 'What to do next:'],
    ['Follow up on', 'Check back on'],
    ['Pathway role', 'Where to start'],
    ['Information status', 'When this was checked'],
    ['Current intake', 'Are they taking new people?'],
    ['Application method', 'How to get started'],
    ['Referral requirement', 'Can I contact them myself?'],
    ['Expected response', 'When you may hear back'],
    ['Documents or information to prepare', 'What to bring or have ready'],
    ['Likely next step', 'Your next step'],
    ['Copy referral steps', 'Copy next steps'],
    ['Directory correction', 'Fix a listing'],
    ['What appears to be wrong?', 'What looks wrong?'],
    ['Eligibility or service description', 'Who can use it or what it offers'],
    ['Program closed or unavailable', 'Program closed or has no openings'],
    ['Correction details', 'What should be changed?'],
    ['Open correction report', 'Send correction'],
    ['Information freshness', 'How recent is this information?'],
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
    ['See next steps', 'See how to apply'],
    ['Official source', 'Visit program website'],
    ['Open official source', 'Visit program website'],
    ['Check current details', 'Visit program website'],
    ['Copy referral summary', 'Copy program details'],
    ['Save resource', 'Save program'],
    ['Remove saved resource', 'Remove saved program'],
    ['Show saved resources only', 'Show only my saved programs'],
    ['Show resources in my plan', 'Show only programs in my plan'],
    ['Primary options', 'Good places to start'],
    ['Backup / specialist options', 'Other options'],
    ['Referral strategy', 'What to do next'],
    ['First action', 'Start here'],
    ['Backup / next step', 'Another option'],
    ['Important limit', 'What to know'],
    ['Age window', 'Age range'],
    ['Eligibility trigger', 'Who can use it'],
    ['Primary value', 'How it can help'],
    ['Recommended next step', 'What to do next'],
    ['Source', 'Program website'],
    ['Directory priority', 'Where to start'],
    ['Recently verified', 'Recently checked'],
    ['Foster-care specific', 'Made for people with foster care experience'],
    ['Youth / foster relevant', 'May help after foster care'],
    ['Youth / partially specific', 'May help after foster care'],
    ['General community resource', 'Open to the wider community'],
    ['All pathway roles', 'All starting points'],
    ['For specific situations', 'For a specific need'],
    ['Recently confirmed', 'Recently checked'],
    ['Verified', 'Checked'],
    ['Confirm availability', 'Check for openings'],
    ['Confirm before relying', 'Check before you go'],
    ['Report outdated info', 'Report a change'],
    ['Report outdated information', 'Report a change'],
    ['View matching resources', 'See programs that may help'],
    ['Call to confirm', 'Call the program'],
    ['Call about referral', 'Call to ask how to apply'],
    ['Official page', 'Program website']
  ]);

  const PHRASE_REPLACEMENTS = [
    [/\bcase management\b/gi, 'help making a plan and finding services'],
    [/\bcase manager\b/gi, 'support person'],
    [/\bsocial worker\b/gi, 'support person'],
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
    [/\bconfirm eligibility\b/gi, 'ask whether you qualify'],
    [/\beligibility requirements\b/gi, 'rules for who can use the program'],
    [/\beligibility\b/gi, 'who can use the program'],
    [/\bservice capacity\b/gi, 'openings'],
    [/\btreatment capacity\b/gi, 'open appointments'],
    [/\bcapacity\b/gi, 'openings'],
    [/\bservice areas?\b/gi, 'areas served'],
    [/\bprovider\b/gi, 'program'],
    [/\bproviders\b/gi, 'programs'],
    [/\bbehavioral health\b/gi, 'mental health and substance use support'],
    [/\bsubstance use disorder\b/gi, 'drug or alcohol recovery'],
    [/\bhousing instability\b/gi, 'risk of losing housing'],
    [/\bhomelessness verification\b/gi, 'proof of your housing situation'],
    [/\bscreening or assessment\b/gi, 'first conversation'],
    [/\bscreening\b/gi, 'first questions'],
    [/\bassessment\b/gi, 'first meeting'],
    [/\bcustody-status\b/gi, 'foster care history'],
    [/\bcustody status\b/gi, 'foster care history'],
    [/\btransition services\b/gi, 'help after foster care'],
    [/\bindependent-living\b/gi, 'living-on-your-own'],
    [/\bindependent living\b/gi, 'living on your own'],
    [/\bworkforce\b/gi, 'jobs and career help'],
    [/\bfinancial capability\b/gi, 'money and budgeting'],
    [/\bsoft skills \/ life skills\b/gi, 'everyday and work skills'],
    [/\bcommunity \/ belonging\b/gi, 'mentoring and connection'],
    [/\blegal \/ identity \/ safety\b/gi, 'legal help, IDs and safety'],
    [/\bmental health \/ recovery\b/gi, 'mental health and recovery'],
    [/\bfunding may be unavailable\b/gi, 'money for the program may not be available'],
    [/\bfunding\b/gi, 'money available'],
    [/\bcohort\b/gi, 'class'],
    [/\badministrative burden\b/gi, 'extra paperwork and calls'],
    [/\bentry point\b/gi, 'place to start'],
    [/\bnavigation\b/gi, 'help finding programs'],
    [/\bcharitable funds\b/gi, 'other financial help'],
    [/\bnot published\b/gi, 'not listed'],
    [/\bvacancy dependent\b/gi, 'depends on openings'],
    [/\bcontinuous intake\b/gi, 'available around the clock'],
    [/\bprofessional or partner\b/gi, 'partner organization'],
    [/\bformal notice\b/gi, 'written notice'],
    [/\bcounty residency\b/gi, 'proof that you live in the county'],
    [/\bcurrent or former foster youth\b/gi, 'people who are or were in foster care'],
    [/\byoung adult\b/gi, 'you'],
    [/\byoung adults\b/gi, 'you']
  ];

  function onReady(callback) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', callback, { once: true });
    else callback();
  }

  function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element && element.textContent !== value) element.textContent = value;
  }

  function updateStaticLanguage() {
    setText('.brand small', 'Find help in the Charlotte area');
    setText('.nav-tab[data-view="directory"]', 'Browse programs');
    setText('.nav-tab[data-view="urgent"]', 'Find help');
    setText('.nav-tab[data-view="foster"]', 'Help after foster care');

    const search = document.getElementById('search-input');
    if (search) search.placeholder = 'Try housing, jobs, food, counseling or GED';

    const filterHeading = document.querySelector('.filter-heading h2');
    if (filterHeading) filterHeading.textContent = 'Narrow your results';

    setText('#view-directory .hero .eyebrow', 'Help for young adults in the Charlotte area');
    setText('#view-directory .hero h1', 'Find help with what you need');
    setText('#view-directory .hero-copy', 'Search local programs for housing, food, jobs, school, healthcare, transportation, legal help, mentoring and other everyday needs.');

    setText('#view-urgent .page-heading .eyebrow', 'Not sure where to start?');
    setText('#view-urgent .page-heading h1', 'Find a good next step');
    setText('#view-urgent .page-heading p:last-child', 'Answer a few simple questions to see programs that may fit. You will not be asked for your name or private details.');

    setText('#view-foster .page-heading .eyebrow', 'Extra help you may qualify for');
    setText('#view-foster .page-heading h1', 'Help after foster care');
    setText('#view-foster .page-heading p:last-child', 'You may be able to get help with housing, school, healthcare and living on your own because you were in foster care. Some programs have age deadlines, so check them as soon as you can.');

    const priorityLabel = document.querySelector('label[for="priority-filter"], #priority-filter')?.closest('.field')?.querySelector('label, .field-label-row label, span');
    if (priorityLabel) priorityLabel.textContent = 'Where to start';
    const savedLabel = document.querySelector('label.check-field span');
    if (savedLabel) savedLabel.textContent = 'Show only programs in my plan';

    const sortLabel = document.querySelector('label[for="sort-select"], #sort-select')?.closest('.sort-field')?.querySelector('label, .sort-label-row label, span');
    if (sortLabel) sortLabel.textContent = 'Sort by';

    updateSelectOption('#sort-select', 'recommended', 'Where to start');
    updateSelectOption('#sort-select', 'verified', 'Recently checked');
    updateSelectOption('#priority-filter', 'all', 'All starting points');
    updateSelectOption('#priority-filter', 'Core', 'Best place to start');
    updateSelectOption('#priority-filter', 'Specialized', 'For a specific need');
    updateSelectOption('#priority-filter', 'Backup', 'Try this next');
    updateSelectOption('#foster-filter', 'yes', 'Made for people with foster care experience');
    updateSelectOption('#foster-filter', 'partial', 'May help after foster care');
    updateSelectOption('#foster-filter', 'no', 'Open to the wider community');
  }

  function updateSelectOption(selector, value, text) {
    const select = document.querySelector(selector);
    const option = select ? [...select.options].find((item) => item.value === value) : null;
    if (option && option.textContent !== text) option.textContent = text;
  }

  function replaceExactLeafText(root = document) {
    root.querySelectorAll('h1, h2, h3, h4, h5, p, span, strong, small, dt, th, button, a, legend, label, option').forEach((element) => {
      if (element.children.length) return;
      const current = element.textContent.trim();
      const replacement = EXACT_TEXT.get(current);
      if (replacement && current !== replacement) element.textContent = replacement;
    });
  }

  function plainify(text) {
    let output = String(text || '');
    PHRASE_REPLACEMENTS.forEach(([pattern, replacement]) => {
      output = output.replace(pattern, replacement);
    });
    output = output
      .replace(/\bYou needs\b/g, 'You need')
      .replace(/\byou needs\b/g, 'you need')
      .replace(/\bYou is\b/g, 'You are')
      .replace(/\byou is\b/g, 'you are')
      .replace(/\bYou has\b/g, 'You have')
      .replace(/\byou has\b/g, 'you have')
      .replace(/\bYou wants\b/g, 'You want')
      .replace(/\byou wants\b/g, 'you want')
      .replace(/\bYou can access\b/g, 'You can use')
      .replace(/\byou can access\b/g, 'you can use')
      .replace(/\s{2,}/g, ' ')
      .trim();
    return output;
  }

  function rewritePlainLanguageBlocks(root = document) {
    const selectors = [
      '.resource-card .trigger',
      '.resource-card .caveat',
      '#resource-dialog .detail-block p',
      '.phase1-pathway-resource > p',
      '.phase1-pathway-resource dd',
      '.phase1-plan-item-main > p:not(.phase1-plan-action)',
      '.phase1-readiness-grid span',
      '.triage-detail p',
      '.need-section p',
      '#foster-table td',
      '#verified-footer',
      '.phase1-verification-summary span'
    ];

    root.querySelectorAll(selectors.join(',')).forEach((element) => {
      if (element.children.length) return;
      const source = element.dataset.plainLanguageSource || element.textContent;
      element.dataset.plainLanguageSource = source;
      const updated = plainify(source);
      if (updated && element.textContent !== updated) element.textContent = updated;
    });
  }

  function rewriteReadinessSection() {
    document.querySelectorAll('.phase1-readiness-grid > div').forEach((row) => {
      const label = row.querySelector('strong');
      if (!label) return;
      const replacement = EXACT_TEXT.get(label.textContent.trim());
      if (replacement) label.textContent = replacement;
    });
  }

  function rewriteTriage() {
    document.querySelectorAll('.triage-card').forEach((card) => {
      const heading = card.querySelector('h2');
      if (heading) {
        const text = heading.textContent.trim();
        const replacements = {
          'Suicidal thoughts or acute mental-health crisis': 'You may hurt yourself or need someone to talk to right now',
          'Homeless tonight or unsafe place to sleep': 'You do not have a safe place to sleep tonight',
          'Former foster youth under 21': 'You were in foster care and are under 21',
          'Ages 16–24 with several practical needs': 'You are 16–24 and need help with several things',
          'No food or basic household items': 'You need food or basic household items',
          'Young adult wants counseling or emotional support related to sexuality, relationships, or identity': 'You want counseling or emotional support about identity, relationships or sexuality'
        };
        if (replacements[text]) heading.textContent = replacements[text];
      }
    });
  }

  function rewritePhase1Notes() {
    document.querySelectorAll('.phase1-context-note').forEach((note) => {
      const text = note.textContent;
      if (text.includes('Foster-care history may open additional options')) {
        note.innerHTML = '<strong>You may qualify for extra help because you were in foster care.</strong> Check the Help after foster care page for programs with age deadlines.';
      } else if (text.includes('Confirm the service area first')) {
        note.innerHTML = '<strong>Check where the program is available.</strong> Some programs below only serve Mecklenburg County. NC 211 can help you find a similar program in another county.';
      }
    });
  }

  function rewriteActionsAndAttributes() {
    document.querySelectorAll('[data-action="save"]').forEach((button) => {
      const saved = button.classList.contains('is-saved');
      button.setAttribute('aria-label', saved ? 'Remove from my plan' : 'Add to my plan');
      button.title = saved ? 'Remove from my plan' : 'Add to my plan';
    });

    document.querySelectorAll('[data-phase1-plan-toggle]').forEach((button) => {
      if (button.textContent.trim() === 'Add to my plan') button.textContent = 'Save to my plan';
    });

    const reportDetails = document.querySelector('#phase1-report-form textarea');
    if (reportDetails) reportDetails.placeholder = 'Tell us what changed. Do not include your name, health information or other private details.';

    const privacy = document.querySelector('.phase1-privacy-note');
    if (privacy) privacy.textContent = 'This opens a public report. Do not include your name, health information or other private details.';
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

  function copyFriendlyProgramDetails() {
    const content = document.getElementById('dialog-content');
    if (!content) return;
    const lines = [content.querySelector('h2')?.textContent || 'Program details', ''];
    content.querySelectorAll('.detail-block').forEach((block) => {
      const heading = block.querySelector('h3')?.textContent.trim();
      const body = block.querySelector('p')?.textContent.trim();
      if (heading && body) lines.push(`${heading}: ${body}`);
    });
    const phone = content.querySelector('a[href^="tel:"]')?.textContent.trim();
    const website = content.querySelector('a[href^="http"]')?.href;
    if (phone) lines.push(`Phone: ${phone.replace(/^Call\s*/i, '')}`);
    if (website) lines.push(`Program website: ${website}`);
    copyText(lines.join('\n'));
  }

  function copyFriendlyPlan() {
    const items = [...document.querySelectorAll('.phase1-plan-item')];
    if (!items.length) return;
    const lines = ['My plan', ''];
    items.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.querySelector('h3')?.textContent.trim() || 'Program'}`);
      const status = item.querySelector('[data-plan-status]')?.selectedOptions?.[0]?.textContent.trim();
      const date = item.querySelector('[data-plan-date]')?.value;
      const next = item.querySelector('.phase1-plan-action')?.textContent.trim();
      if (status) lines.push(`Status: ${status}`);
      if (date) lines.push(`Check back on: ${date}`);
      if (next) lines.push(next);
      const phone = item.querySelector('a[href^="tel:"]')?.href.replace('tel:', '');
      const website = item.querySelector('a[href^="http"]')?.href;
      if (phone) lines.push(`Phone: ${phone}`);
      if (website) lines.push(`Program website: ${website}`);
      lines.push('');
    });
    copyText(lines.join('\n'));
  }

  function installCopyOverrides() {
    window.addEventListener('click', (event) => {
      const programCopy = event.target.closest('[data-dialog-action="copy"]');
      if (programCopy) {
        event.preventDefault();
        event.stopImmediatePropagation();
        copyFriendlyProgramDetails();
        return;
      }

      const planCopy = event.target.closest('[data-copy-plan]');
      if (planCopy) {
        event.preventDefault();
        event.stopImmediatePropagation();
        copyFriendlyPlan();
      }
    }, true);
  }

  let queued = false;
  function applyLanguage() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      updateStaticLanguage();
      replaceExactLeafText();
      rewritePlainLanguageBlocks();
      rewriteReadinessSection();
      rewriteTriage();
      rewritePhase1Notes();
      rewriteActionsAndAttributes();
    });
  }

  function init() {
    installCopyOverrides();
    applyLanguage();
    const observer = new MutationObserver(applyLanguage);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  onReady(init);
})();
