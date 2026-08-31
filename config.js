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

// Temporary data corrections only. Descriptions and interface language are not rewritten here.
// These corrections can be removed after the source workbook and generated JSON are rebuilt.
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
        referralTrigger: 'Provides affordable transitional housing and stability support for single women age 18 or older who live without children and have at least $700 in monthly take-home income.',
        eligibility: 'Single women age 18 or older who live without children, have at least $700 in monthly take-home income, earn no more than 60% of the area median income and can live in a shared home with limited staff supervision.',
        provides: 'Affordable month-to-month housing for up to 18 months, including utilities, employment support, budgeting help, workshops, computer and internet access, social activities and a fitness-center membership.',
        access: 'A partner organization or Coordinated Assessment must submit the application. Applicants should provide income information and documents showing their housing situation.',
        phone: '980-283-2334',
        location: 'YWCA Central Carolinas, Charlotte / Mecklenburg County.',
        caveat: 'This is not emergency housing. Openings depend on room availability. Applicants in recovery from drug or alcohol use must have six months without use before applying.',
        sourceUrl: 'https://ywcacentralcarolinas.org/programs/housing/women-in-transition/',
        lastVerified: '2026-08-14',
        referralStatus: 'Not contacted',
        notes: 'A partner organization must submit the application. Incomplete applications are not added to the waiting list.',
        area: 'Charlotte / Mecklenburg',
        areaGroup: 'Charlotte / Mecklenburg',
        radiusNote: 'Located in Charlotte and serving Mecklenburg County.'
      });
    }
  }

  if (Array.isArray(data?.triage)) {
    data.triage = data.triage.map((item) => {
      if (item.firstAction !== 'Time Out Youth') return item;
      return {
        situation: 'A young adult needs counseling or emotional support related to identity, relationships or sexuality',
        firstAction: 'Mental Health America of Central Carolinas — Counseling',
        phone: '704-565-3315',
        backup: 'The Barnabas Center also provides professional counseling with a faith-based option. The 988 Lifeline provides immediate crisis support, and 911 is appropriate for immediate danger.',
        limit: 'Counseling availability and fit vary. The young adult or support person should call first to ask about openings, cost and whether the counselor can meet the identified needs.'
      };
    });
  }

  if (Array.isArray(data?.fosterPrograms)) {
    data.fosterPrograms = data.fosterPrograms.filter((item) =>
      !isExcludedOrganizationName(item.program)
    );
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
  'Homeless tonight or unsafe place to sleep': 'https://housingdata.mecknc.gov/coc/services/coordinated-entry',
  'Former foster youth under 21': 'https://cfas.mecknc.gov/services/adoption-and-foster-care/LINKS',
  'Ages 16–24 with several practical needs': 'https://therelatives.org/our-programs/on-ramp-resource-center/',
  'Domestic violence or sexual assault': 'https://www.safealliance.org/programs/greater-charlotte-hope-line/',
  'No food or basic household items': 'https://nourishup.org/findfood/',
  'A young adult needs counseling or emotional support related to identity, relationships or sexuality': 'https://mhaofcc.org/program/counseling'
};

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#priority-filter option[value="Verify"]')?.remove();

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
