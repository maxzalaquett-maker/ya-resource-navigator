window.RESOURCE_NAVIGATOR_CONFIG = {
  // Set this to true only for a private/internal deployment.
  showPartnershipPlanner: false,
  pageSize: 18
};

// Correct a legacy description that accidentally implied a directory relationship with
// My Farm Camps Experience. The organizations are not affiliated; keep the directory
// language neutral until the source data is rebuilt.
//
// The directory does not list Time Out Youth as a referral partner. Young adults who want
// counseling or emotional support related to sexuality, relationships, or identity should
// still be welcomed and routed through the general professional counseling resources in
// the navigator.
const originalResponseJson = Response.prototype.json;
Response.prototype.json = async function (...args) {
  const data = await originalResponseJson.apply(this, args);

  if (Array.isArray(data?.resources)) {
    data.resources = data.resources.filter((resource) => !String(resource.name || '').includes('Time Out Youth'));

    const myFarmCamps = data.resources.find((resource) => resource.name === 'My Farm Camps Experience');
    if (myFarmCamps) {
      myFarmCamps.referralTrigger = 'A young adult wants to explore a farm-based experiential opportunity involving animals, riding, gardening or animal-assisted activities.';
      myFarmCamps.notes = 'Potential experiential or partnership resource; not a guaranteed clinical referral.';
    }

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
        referralTrigger: 'An unaccompanied adult woman experiencing or at risk of homelessness needs affordable transitional housing and structured support.',
        eligibility: 'Adults age 18 or older identifying as female who are single and unaccompanied with no dependent children; minimum $700 monthly net income and income no more than 60% AMI; able to live in a minimally supervised group setting. Additional screening applies.',
        provides: 'Month-to-month transitional housing for up to 18 months, below-market rent and utilities, case management, career counseling, financial planning, educational workshops, computer and internet access, social activities and fitness-center membership.',
        access: 'Referral only through a partner agency or Coordinated Assessment. The referring worker submits the program application, case summary, release of information, income documentation and homelessness verification when applicable.',
        phone: '980-283-2334',
        location: 'YWCA Central Carolinas, Charlotte / Mecklenburg County.',
        caveat: 'Not emergency or immediate housing. Intake orientations depend on upcoming vacancies. Applicants in recovery from substance use disorder must have six months of clean time before referral.',
        sourceUrl: 'https://ywcacentralcarolinas.org/programs/housing/women-in-transition/',
        lastVerified: '2026-08-14',
        referralStatus: 'Not contacted',
        notes: 'Program is referral-only; incomplete referrals are not placed on the waitlist.',
        area: 'Charlotte / Mecklenburg',
        areaGroup: 'Charlotte / Mecklenburg',
        radiusNote: 'Located in or serving the requested roughly 30-mile Charlotte search area.'
      });
    }
  }

  if (Array.isArray(data?.triage)) {
    data.triage = data.triage.map((item) => {
      if (item.firstAction !== 'Time Out Youth') return item;
      return {
        situation: 'Young adult wants counseling or emotional support related to sexuality, relationships, or identity',
        firstAction: 'Mental Health America of Central Carolinas — Counseling',
        phone: '704-565-3315',
        backup: 'The Barnabas Center offers faith-informed professional counseling. Use 988 or 911 when there is an immediate safety or mental-health crisis.',
        limit: 'Counseling should protect the young adult’s dignity, safety, privacy, and voluntary goals. Confirm provider fit and current availability before referral.'
      };
    });
  }

  if (Array.isArray(data?.needsMap)) {
    const removeTimeOutYouthOption = (value) => String(value || '')
      .split(';')
      .map((option) => option.trim())
      .filter((option) => option && !option.includes('Time Out Youth'))
      .join('; ');

    data.needsMap.forEach((item) => {
      item.primaryOptions = removeTimeOutYouthOption(item.primaryOptions);
      item.backupOptions = removeTimeOutYouthOption(item.backupOptions);
    });
  }

  if (Array.isArray(data?.partnerships)) {
    data.partnerships = data.partnerships.filter((item) => !String(item.organization || '').includes('Time Out Youth'));
  }

  return data;
};

// Load responsive enhancements separately so the core directory stays easy to maintain.
const mobileStylesheet = document.createElement('link');
mobileStylesheet.rel = 'stylesheet';
mobileStylesheet.href = '/mobile.css';
document.head.appendChild(mobileStylesheet);

const mobileEnhancements = document.createElement('script');
mobileEnhancements.src = '/mobile.js';
document.head.appendChild(mobileEnhancements);

// Load accessible classification help for the directory filters.
const filterTooltipStylesheet = document.createElement('link');
filterTooltipStylesheet.rel = 'stylesheet';
filterTooltipStylesheet.href = '/filter-tooltips.css';
document.head.appendChild(filterTooltipStylesheet);

const filterTooltipEnhancements = document.createElement('script');
filterTooltipEnhancements.src = '/filter-tooltips.js';
document.head.appendChild(filterTooltipEnhancements);

// Small presentation fixes that layer on top of the base stylesheet.
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

  /* Never render the old confirmation toast. */
  #toast,
  .toast,
  .toast.is-visible {
    display: none !important;
  }
`;
document.head.appendChild(headingStyle);

// Official / primary-source pages for the Urgent Help cards.
// These are added here so the triage content can keep its current data structure.
const RESOURCE_NAVIGATOR_TRIAGE_LINKS = {
  'Immediate danger, overdose, violence or serious injury': 'https://www.charlottenc.gov/Public-Safety/Emergency-Management/Prepare',
  'Suicidal thoughts or acute mental-health crisis': 'https://988lifeline.org/get-help/',
  'Homeless tonight or unsafe place to sleep': 'https://housingdata.mecknc.gov/coc/services/coordinated-entry',
  'Former foster youth under 21': 'https://cfas.mecknc.gov/services/adoption-and-foster-care/LINKS',
  'Ages 16–24 with several practical needs': 'https://therelatives.org/our-programs/on-ramp-resource-center/',
  'Domestic violence or sexual assault': 'https://www.safealliance.org/programs/greater-charlotte-hope-line/',
  'No food or basic household items': 'https://nourishup.org/findfood/',
  'Young adult wants counseling or emotional support related to sexuality, relationships, or identity': 'https://mhaofcc.org/program/counseling'
};

document.addEventListener('DOMContentLoaded', () => {
  // Use a clearer name for the section that groups organizations by the needs they serve.
  const needsTab = document.querySelector('.nav-tab[data-view="needs"]');
  if (needsTab) needsTab.textContent = 'Support by need';

  const needsHeading = document.querySelector('#view-needs .page-heading');
  if (needsHeading) {
    const eyebrow = needsHeading.querySelector('.eyebrow');
    const title = needsHeading.querySelector('h1');
    const description = needsHeading.querySelector('p:last-child');

    if (eyebrow) eyebrow.textContent = 'Organizations grouped by need';
    if (title) title.textContent = 'Support by need';
    if (description) {
      description.textContent = 'Browse organizations grouped by the practical needs they serve, including housing, food, work, education, transportation, healthcare, mental health, benefits, legal help, documents, budgeting and more.';
    }
  }

  // Remove the toast node after app.js has cached its references. This keeps existing
  // copy/save code from throwing while ensuring the toast can never appear onscreen.
  setTimeout(() => {
    document.getElementById('toast')?.remove();
  }, 0);

  const triageGrid = document.getElementById('triage-grid');
  if (!triageGrid) return;

  const addTriageLinks = () => {
    triageGrid.querySelectorAll('.triage-card').forEach((card) => {
      const heading = card.querySelector('h2');
      const action = card.querySelector('.triage-action');
      if (!heading || !action) return;

      // The rendered markup uses an inline <span> followed by an inline <strong>.
      // Force the text block itself to stack so the label and action can never sit side by side.
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
