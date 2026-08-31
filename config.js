window.RESOURCE_NAVIGATOR_CONFIG = {
  // Set this to true only for a private/internal deployment.
  showPartnershipPlanner: false,
  pageSize: 18,
  phase1Enabled: true,
  feedbackUrl: 'https://github.com/maxzalaquett-maker/ya-resource-navigator/issues/new',
  verificationFreshDays: 30,
  verificationCurrentDays: 90,
  verificationAgingDays: 180
};

const EXCLUDED_ORGANIZATION_NAMES = [
  'mecklenburg gear up',
  'gear up pilot',
  'hud foster youth to independence',
  'hud fyi voucher',
  'targeted housing assistance program',
  'thap-in',
  'buildstrong academy',
  'agape acres',
  'my farm camps experience'
];

function isExcludedOrganizationName(value) {
  const name = String(value || '').toLowerCase();
  return EXCLUDED_ORGANIZATION_NAMES.some((excluded) => name.includes(excluded));
}

function removeExcludedOptions(value) {
  return String(value || '')
    .split(';')
    .map((option) => option.trim())
    .filter((option) => option && !isExcludedOrganizationName(option) && !option.includes('Time Out Youth'))
    .join('; ');
}

// Apply source-data corrections until the workbook is rebuilt.
const originalResponseJson = Response.prototype.json;
Response.prototype.json = async function (...args) {
  const data = await originalResponseJson.apply(this, args);

  if (Array.isArray(data?.resources)) {
    data.resources = data.resources.filter((resource) =>
      resource.priority !== 'Verify' &&
      !String(resource.name || '').includes('Time Out Youth') &&
      !isExcludedOrganizationName(resource.name)
    );

    if (data.meta) data.meta.resourceCount = data.resources.length;

    const womenInTransition = data.resources.find((resource) =>
      resource.name === 'YWCA Central Carolinas — Transitional Housing' ||
      resource.name === 'YWCA Central Carolinas — Women in Transition'
    );

    if (womenInTransition) {
      Object.assign(womenInTransition, {
        supportAreas: 'Housing / homelessness; Employment / workforce; Soft skills / life skills; Financial capability; Community / belonging',
        name: 'YWCA Central Carolinas — Women in Transition',
        fosterSpecific: 'No',
        priority: 'Specialized',
        referralTrigger: 'You are a woman age 18 or older without children living with you, you have some monthly income and you need an affordable place to stay while you work toward more stable housing.',
        eligibility: 'You must be 18 or older, identify as a woman, be single and living without children, have at least $700 in monthly take-home income, and earn no more than 60% of the area median income. You must also be able to live in a shared home with limited staff supervision.',
        provides: 'Affordable month-to-month housing for up to 18 months, with utilities, help finding work, budgeting support, workshops, computer and internet access, social activities and a fitness-center membership.',
        access: 'You cannot apply on your own. A partner organization or Coordinated Assessment, the county housing-help system, must apply with you. Be ready to share income information and papers that show your housing situation.',
        phone: '980-283-2334',
        location: 'YWCA Central Carolinas, Charlotte / Mecklenburg County.',
        caveat: 'This is not emergency housing. Openings depend on when a room becomes available. If you are in recovery from drug or alcohol use, the program requires six months without use before applying.',
        sourceUrl: 'https://ywcacentralcarolinas.org/programs/housing/women-in-transition/',
        lastVerified: '2026-08-14',
        referralStatus: 'Not contacted',
        notes: 'A partner organization must apply with you. Incomplete applications are not added to the waiting list.',
        area: 'Charlotte / Mecklenburg',
        areaGroup: 'Charlotte / Mecklenburg',
        radiusNote: 'Located in Charlotte and serving Mecklenburg County.'
      });
    }
  }

  if (Array.isArray(data?.triage)) {
    data.triage = data.triage.map((item) => {
      if (item.firstAction === 'Time Out Youth') {
        return {
          situation: 'You want counseling or emotional support about identity, relationships or sexuality',
          firstAction: 'Mental Health America of Central Carolinas — Counseling',
          phone: '704-565-3315',
          backup: 'The Barnabas Center also offers professional counseling with a faith-based option. Call or text 988 when you may hurt yourself or need someone to talk to right now. Call 911 if you are in immediate danger.',
          limit: 'Choose support that respects your safety, privacy, identity and goals. Call first to ask about openings and whether the counselor feels like a good fit.',
        };
      }

      if (item.situation === 'Former foster youth under 21') {
        return {
          ...item,
          backup: 'Ask about Foster Care 18 to 21, Medicaid and education money available to people who were in foster care.'
        };
      }

      return item;
    });
  }

  if (Array.isArray(data?.fosterPrograms)) {
    data.fosterPrograms = data.fosterPrograms.filter((item) => !isExcludedOrganizationName(item.program));
  }

  if (Array.isArray(data?.needsMap)) {
    data.needsMap.forEach((item) => {
      item.primaryOptions = removeExcludedOptions(item.primaryOptions);
      item.backupOptions = removeExcludedOptions(item.backupOptions);
    });
  }

  if (Array.isArray(data?.partnerships)) {
    data.partnerships = data.partnerships.filter((item) =>
      !String(item.organization || '').includes('Time Out Youth') &&
      !isExcludedOrganizationName(item.organization)
    );
  }

  return data;
};

function loadStyle(href) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

function loadScript(src) {
  const script = document.createElement('script');
  script.src = src;
  script.async = false;
  document.head.appendChild(script);
}

// Keep enhancements modular so the core static directory remains maintainable.
loadStyle('/mobile.css');
loadScript('/mobile.js');
loadStyle('/filter-tooltips.css');
loadScript('/filter-tooltips.js');
loadStyle('/phase1.css');
loadScript('/phase1.js');

const headingStyle = document.createElement('style');
headingStyle.textContent = `
  h1, h2, h3 { line-height: 1.05; }

  .triage-action > div:first-child:not(.card-actions) {
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: .18rem;
  }
  .triage-action .eyebrow {
    display: block !important;
    margin: 0 !important;
  }
  .triage-action strong { display: block !important; }

  #toast,
  .toast,
  .toast.is-visible {
    display: none !important;
  }
`;
document.head.appendChild(headingStyle);

const RESOURCE_NAVIGATOR_TRIAGE_LINKS = {
  'Immediate danger, overdose, violence or serious injury': 'https://www.charlottenc.gov/Public-Safety/Emergency-Management/Prepare',
  'Suicidal thoughts or acute mental-health crisis': 'https://988lifeline.org/get-help/',
  'You may hurt yourself or need someone to talk to right now': 'https://988lifeline.org/get-help/',
  'Homeless tonight or unsafe place to sleep': 'https://housingdata.mecknc.gov/coc/services/coordinated-entry',
  'You do not have a safe place to sleep tonight': 'https://housingdata.mecknc.gov/coc/services/coordinated-entry',
  'Former foster youth under 21': 'https://cfas.mecknc.gov/services/adoption-and-foster-care/LINKS',
  'You were in foster care and are under 21': 'https://cfas.mecknc.gov/services/adoption-and-foster-care/LINKS',
  'Ages 16–24 with several practical needs': 'https://therelatives.org/our-programs/on-ramp-resource-center/',
  'You are 16–24 and need help with several things': 'https://therelatives.org/our-programs/on-ramp-resource-center/',
  'Domestic violence or sexual assault': 'https://www.safealliance.org/programs/greater-charlotte-hope-line/',
  'No food or basic household items': 'https://nourishup.org/findfood/',
  'You need food or basic household items': 'https://nourishup.org/findfood/',
  'Young adult wants counseling or emotional support related to sexuality, relationships, or identity': 'https://mhaofcc.org/program/counseling',
  'You want counseling or emotional support about identity, relationships or sexuality': 'https://mhaofcc.org/program/counseling'
};

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#priority-filter option[value="Verify"]')?.remove();

  const needsTab = document.querySelector('.nav-tab[data-view="needs"]');
  if (needsTab) needsTab.textContent = 'Find help by need';

  const needsHeading = document.querySelector('#view-needs .page-heading');
  if (needsHeading) {
    const eyebrow = needsHeading.querySelector('.eyebrow');
    const title = needsHeading.querySelector('h1');
    const description = needsHeading.querySelector('p:last-child');
    if (eyebrow) eyebrow.textContent = 'Browse by need';
    if (title) title.textContent = 'Find help by need';
    if (description) {
      description.textContent = 'Browse programs for housing, food, jobs, school, transportation, healthcare, mental health, benefits, legal help, IDs, budgeting and more.';
    }
  }

  // app.js keeps the element reference after this removal, preventing the legacy toast from displaying.
  setTimeout(() => document.getElementById('toast')?.remove(), 0);

  const triageGrid = document.getElementById('triage-grid');
  if (!triageGrid) return;

  const addTriageLinks = () => {
    triageGrid.querySelectorAll('.triage-card').forEach((card) => {
      const heading = card.querySelector('h2');
      const action = card.querySelector('.triage-action');
      if (!heading || !action) return;

      const textBlock = action.querySelector(':scope > div:first-child:not(.card-actions)');
      if (textBlock) {
        textBlock.style.display = 'flex';
        textBlock.style.flexDirection = 'column';
        textBlock.style.alignItems = 'flex-start';
      }

      if (card.querySelector('[data-triage-learn-more]')) return;
      const url = RESOURCE_NAVIGATOR_TRIAGE_LINKS[heading.textContent.trim()];
      if (!url) return;

      let actions = action.querySelector('.card-actions');
      if (!actions) {
        actions = document.createElement('div');
        actions.className = 'card-actions';
        const callButton = action.querySelector('a.button');
        if (callButton) actions.appendChild(callButton);
        action.appendChild(actions);
      }

      const learnMore = document.createElement('a');
      learnMore.className = 'button button-secondary';
      learnMore.href = url;
      learnMore.target = '_blank';
      learnMore.rel = 'noopener noreferrer';
      learnMore.dataset.triageLearnMore = 'true';
      learnMore.textContent = 'Learn more';
      actions.appendChild(learnMore);
    });
  };

  addTriageLinks();
  new MutationObserver(addTriageLinks).observe(triageGrid, { childList: true, subtree: true });
});
