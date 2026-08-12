window.FARM127_CONFIG = {
  // Set this to true only for a private/internal deployment.
  showPartnershipPlanner: false,
  pageSize: 18
};

// Slightly tighter heading line-height for the brand type system,
// plus stacked labels/values in Urgent Help action cards.
const headingStyle = document.createElement('style');
headingStyle.textContent = `
  h1, h2, h3 { line-height: 1.05; }
  .triage-action .eyebrow { display: block; margin: 0 0 .2rem; }
  .triage-action strong { display: block; }
`;
document.head.appendChild(headingStyle);

// Official / primary-source pages for the Urgent Help cards.
// These are added here so the triage content can keep its current data structure.
const FARM127_TRIAGE_LINKS = {
  'Immediate danger, overdose, violence or serious injury': 'https://www.charlottenc.gov/Public-Safety/Emergency-Management/Prepare',
  'Suicidal thoughts or acute mental-health crisis': 'https://988lifeline.org/get-help/',
  'Homeless tonight or unsafe place to sleep': 'https://housingdata.mecknc.gov/coc/services/coordinated-entry',
  'Former foster youth under 21': 'https://cfas.mecknc.gov/services/adoption-and-foster-care/LINKS',
  'Ages 16–24 with several practical needs': 'https://therelatives.org/our-programs/on-ramp-resource-center/',
  'Domestic violence or sexual assault': 'https://www.safealliance.org/programs/greater-charlotte-hope-line/',
  'No food or basic household items': 'https://nourishup.org/findfood/',
  'LGBTQ+ young adult needs affirming housing/support': 'https://timeoutyouth.org/housing-supportive-services/'
};

document.addEventListener('DOMContentLoaded', () => {
  const triageGrid = document.getElementById('triage-grid');
  if (!triageGrid) return;

  const addTriageLinks = () => {
    triageGrid.querySelectorAll('.triage-card').forEach((card) => {
      if (card.querySelector('[data-triage-learn-more]')) return;

      const heading = card.querySelector('h2');
      const action = card.querySelector('.triage-action');
      if (!heading || !action) return;

      const url = FARM127_TRIAGE_LINKS[heading.textContent.trim()];
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
