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

const FOSTER_PROGRAM_COPY = {
  'Mecklenburg LINKS': {
    eligibilityTrigger: 'You are or were in foster care in Mecklenburg County. County rules apply.',
    primaryValue: 'Help planning for housing, school, work and living on your own, plus some financial help.',
    recommendedAction: 'Call as soon as possible and explain when you entered and left foster care.'
  },
  'Phoenix Project': {
    eligibilityTrigger: 'You were in foster care in Mecklenburg County and are no longer in county care. Call to check whether you qualify.',
    primaryValue: 'Help after leaving foster care, including some financial support.',
    recommendedAction: 'Call 704-336-3290 before your 21st birthday.'
  },
  'Foster Care 18 to 21 / VPA': {
    eligibilityTrigger: 'You must meet North Carolina rules and sign a voluntary agreement.',
    primaryValue: 'A place to live, help making a plan and financial support through age 21.',
    recommendedAction: 'Call LINKS before you leave foster care. Do not wait until after your 18th birthday.'
  },
  'Medicaid for Former Foster Care Youth': {
    eligibilityTrigger: 'You were in foster care and had Medicaid. Other rules may apply.',
    primaryValue: 'Health insurance for doctor visits, medicine and mental health care.',
    recommendedAction: 'On the application, clearly say that you were in foster care.'
  },
  'Children and Families Specialty Plan': {
    ageWindow: 'Often under 26 if you qualify based on foster care history',
    eligibilityTrigger: 'You have Medicaid and meet the program’s foster care rules.',
    primaryValue: 'A Medicaid plan designed for people with foster care experience, with help organizing healthcare.',
    recommendedAction: 'Check which plan you have and make sure your phone number and address are current.'
  },
  'NC Reach': {
    ageWindow: 'College or career school; check current age rules',
    eligibilityTrigger: 'You left foster care at age 18 or were adopted after age 12, attend an eligible North Carolina public school and take at least half of a full course load.',
    primaryValue: 'A scholarship that helps cover approved school costs left after other financial aid.',
    recommendedAction: 'Complete the FAFSA and NC Reach application before classes begin.'
  },
  'Education and Training Voucher': {
    eligibilityTrigger: 'You are or were in foster care, or left care through some adoptions or guardianships. Check the current rules.',
    primaryValue: 'Money for approved college, career-school and training costs, up to the program limit.',
    recommendedAction: 'Ask LINKS or your school financial-aid office how to use ETV with other aid.'
  },
  'Youth Villages LifeSet': {
    eligibilityTrigger: 'You are preparing to leave foster care or recently left, and you meet local program rules.',
    primaryValue: 'One-on-one help with housing, jobs, school, money and daily life.',
    recommendedAction: 'Contact the Charlotte-area program and ask whether it has openings.'
  },
  'The Relatives On Ramp': {
    eligibilityTrigger: 'You are age 16–24 and live in Mecklenburg County. You do not need foster care experience.',
    primaryValue: 'One place to get help making a plan and connecting with many types of support.',
    recommendedAction: 'Contact On Ramp when you need help with several things or do not know where to start.'
  },
  'The Relatives Housing': {
    eligibilityTrigger: 'You are age 18–24 and do not have safe, stable housing, may lose housing or are leaving violence. The program will ask a few questions first.',
    primaryValue: 'Housing in apartments around the community, plus help with your goals and everyday needs.',
    recommendedAction: 'Contact the program early. Housing depends on openings.'
  },
  'Charlotte Angels Dare to Dream': {
    eligibilityTrigger: 'You are generally age 11–22 and are in foster care.',
    primaryValue: 'A long-term volunteer mentor.',
    recommendedAction: 'Tell the program about any mentor you already have so everyone can work together.'
  },
  'SaySo': {
    ageWindow: 'Teens through the mid-20s, depending on the activity',
    eligibilityTrigger: 'You have lived in foster care, a group home, kinship care or another home outside your birth family.',
    primaryValue: 'A peer community, leadership opportunities and a chance to speak up about the foster care system.',
    recommendedAction: 'Join if you want to meet people with similar experiences and use your voice.'
  },
  'I Am Here legal hotline': {
    ageWindow: 'Young people without safe, stable housing',
    eligibilityTrigger: 'You need legal help getting an ID, birth certificate or another important document.',
    primaryValue: 'Help getting IDs, birth certificates and other important documents.',
    recommendedAction: 'Call or text 1-888-870-DOCS and ask about current hours.'
  },
  'Home4Me — LEG Up on LIFE': {
    ageWindow: 'Different groups for teens, young adults and people over 20',
    eligibilityTrigger: 'You are leaving foster care or want support as you become more independent. Ask which group is open.',
    primaryValue: 'Mentoring, coaching, money skills, leadership and everyday living skills.',
    recommendedAction: 'Ask about the current weekly online group and the group that best fits your age.'
  },
  "Machiah's House": {
    eligibilityTrigger: 'You are a young woman preparing to leave or recently left foster care. The program will ask a few questions first.',
    primaryValue: 'Workshops, supportive relationships and help preparing for adult life.',
    recommendedAction: 'Ask what programs are running now. Do not assume it offers housing.'
  },
  'Congregations for Kids — Mentor Match': {
    eligibilityTrigger: 'You are under 18 and currently in foster care through Mecklenburg or Union County.',
    primaryValue: 'A committed adult mentor before you leave foster care.',
    recommendedAction: 'Use this before age 18 and tell the program about any other mentor you have.'
  },
  'Livingstone College H.O.P.E. Emancipation Project': {
    ageWindow: 'Preparing for college',
    eligibilityTrigger: 'You have foster care experience or were legally independent and are interested in Livingstone College.',
    primaryValue: 'Help applying to Livingstone and support for students with foster care experience.',
    recommendedAction: 'Contact the project before you apply and ask about money, housing and help staying in school.'
  }
};

const NEEDS_COPY = {
  'Housing stability': {
    domain: 'Housing',
    strategy: 'Contact Coordinated Entry when you do not have a safe place to stay. If you received an eviction or move-out notice, also ask about help that may keep you housed.'
  },
  'Food and basic needs': {
    strategy: 'Use emergency food now, and also apply for SNAP/FNS if you may qualify.'
  },
  'Employment': {
    domain: 'Jobs',
    strategy: 'Choose one job or career program to start with so you have one clear plan and fewer missed appointments.'
  },
  'Education': {
    strategy: 'Some school money for people with foster care experience has strict age and history rules. Check before you register.'
  },
  'Transportation': {
    strategy: 'Check the route, travel time and monthly cost before accepting a job or school schedule.'
  },
  'Primary health care': {
    domain: 'Doctors and healthcare',
    strategy: 'Find a regular doctor or clinic instead of relying only on the emergency room.'
  },
  'Mental health': {
    strategy: 'Call or text 988 if you may hurt yourself or need someone right now. For regular counseling, ask about insurance, cost and waiting lists.'
  },
  'Substance-use recovery': {
    domain: 'Drug or alcohol recovery',
    strategy: 'Ask a professional what type of help fits your situation. A mentor can support you, but does not replace professional care.'
  },
  'Benefits': {
    domain: 'Benefits and public assistance',
    strategy: 'Write down when you applied, your application number, papers requested and any deadline to appeal a decision.'
  },
  'Budgeting / credit': {
    domain: 'Money, budgeting and credit',
    strategy: 'Talk with a trusted nonprofit counselor before using high-cost loans or debt-settlement products.'
  },
  'Documents / ID': {
    domain: 'IDs and important documents',
    strategy: 'Start early. Missing an ID, birth certificate or Social Security card can delay work, housing, benefits and school.'
  },
  'Legal': {
    strategy: 'Court and legal deadlines can come quickly. Contact a legal-help program as soon as you receive a notice or court papers.'
  },
  'Parenting / child care': {
    domain: 'Parenting and child care',
    strategy: 'Applying for child-care help and finding an open child-care provider are two separate steps.'
  },
  'Safety / domestic violence / trafficking': {
    domain: 'Safety, relationship violence and trafficking',
    strategy: 'Make a safety plan based on what feels safest to you. Protect private location and contact information.'
  },
  'Mentorship / community / belonging': {
    domain: 'Mentoring and community',
    strategy: 'One consistent trusted person is often more helpful than several people giving different advice.'
  },
  'Soft skills / life skills': {
    domain: 'Everyday and work skills',
    strategy: 'Choose a program where you can practice the skill in real life. Avoid signing up for several similar classes at the same time.'
  }
};

const TRIAGE_COPY = {
  'Immediate danger, overdose, violence or serious injury': {
    backup: 'After you are safe, use the crisis, violence or trafficking programs that fit what happened.',
    limit: 'Call 911 now. Do not wait for a regular program when there is immediate danger or a serious medical emergency.'
  },
  'Suicidal thoughts or acute mental-health crisis': {
    situation: 'You may hurt yourself or need someone to talk to right now',
    firstAction: 'Call or text 988',
    backup: 'Mecklenburg Mobile Crisis: 704-566-3410, option 1.',
    limit: 'Call 911 if you are in immediate danger or have a serious medical emergency.'
  },
  'Homeless tonight or unsafe place to sleep': {
    situation: 'You do not have a safe place to sleep tonight',
    firstAction: 'Call Coordinated Entry',
    backup: 'Ages 16–24: The Relatives On Ramp. Men: Roof Above. Women and children: Center of Hope.',
    limit: 'Beds and housing may not be open. A first conversation does not promise a place to stay.'
  },
  'Former foster youth under 21': {
    situation: 'You were in foster care and are under 21',
    firstAction: 'Call Mecklenburg LINKS / Phoenix',
    backup: 'Ask about Foster Care 18 to 21, Medicaid and education money available to people who were in foster care.',
    limit: 'Some help ends at age 21, so call as soon as you can.'
  },
  'Ages 16–24 with several practical needs': {
    situation: 'You are 16–24 and need help with several things',
    firstAction: 'Call The Relatives On Ramp',
    backup: 'NC 211 and Mecklenburg Community Resource Centers can also help you find programs and benefits.',
    limit: 'Call before you go because hours and openings can change.'
  },
  'Domestic violence or sexual assault': {
    situation: 'You are dealing with relationship violence or sexual assault',
    firstAction: 'Call the Safe Alliance Hope Line',
    backup: 'Call 911 if you are in immediate danger. Legal Aid and Charlotte Center for Legal Advocacy may help with legal needs.',
    limit: 'Protect private information about where you are staying and how to contact you.'
  },
  'No food or basic household items': {
    situation: 'You need food or basic household items',
    firstAction: 'Apply for SNAP and contact Nourish Up',
    backup: 'You can also try the Crisis Assistance Free Store or the Second Harvest food finder.',
    limit: 'Use emergency food now, and also apply for longer-term food help if you may qualify.'
  }
};

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
          limit: 'Choose support that respects your safety, privacy, identity and goals. Call first to ask about openings and whether the counselor feels like a good fit.'
        };
      }
      return { ...item, ...(TRIAGE_COPY[item.situation] || {}) };
    });
  }

  if (Array.isArray(data?.fosterPrograms)) {
    data.fosterPrograms = data.fosterPrograms
      .filter((item) => !isExcludedOrganizationName(item.program))
      .map((item) => ({ ...item, ...(FOSTER_PROGRAM_COPY[item.program] || {}) }));
  }

  if (Array.isArray(data?.needsMap)) {
    data.needsMap.forEach((item) => {
      const originalDomain = item.domain;
      item.primaryOptions = removeExcludedOptions(item.primaryOptions);
      item.backupOptions = removeExcludedOptions(item.backupOptions);
      Object.assign(item, NEEDS_COPY[originalDomain] || {});
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
  'You are dealing with relationship violence or sexual assault': 'https://www.safealliance.org/programs/greater-charlotte-hope-line/',
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
