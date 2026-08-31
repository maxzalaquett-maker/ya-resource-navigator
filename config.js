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
loadScript('/filter-accordions.js');
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
