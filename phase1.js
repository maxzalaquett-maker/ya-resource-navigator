(() => {
  'use strict';

  const cleanupStyles = document.createElement('link');
  cleanupStyles.rel = 'stylesheet';
  cleanupStyles.href = '/style-cleanup.css';
  document.head.appendChild(cleanupStyles);

  const structureStyles = document.createElement('link');
  structureStyles.rel = 'stylesheet';
  structureStyles.href = '/site-structure.css';
  document.head.appendChild(structureStyles);

  // Load the design-system layer after the component styles.
  const brandStyles = document.createElement('link');
  brandStyles.rel = 'stylesheet';
  brandStyles.href = '/compass-brand.css';
  document.head.appendChild(brandStyles);

  // Keep all final breakpoint, dropdown and mobile presentation rules together.
  const responsiveStyles = document.createElement('link');
  responsiveStyles.rel = 'stylesheet';
  responsiveStyles.href = '/responsive.css';
  document.head.appendChild(responsiveStyles);

  // Load small alignment fixes last so they are not undone by earlier layers.
  const polishStyles = document.createElement('link');
  polishStyles.rel = 'stylesheet';
  polishStyles.href = '/interface-polish.css';
  document.head.appendChild(polishStyles);

  // The homepage layer comes last because it introduces a new routing surface.
  const homepageStyles = document.createElement('link');
  homepageStyles.rel = 'stylesheet';
  homepageStyles.href = '/homepage.css';
  document.head.appendChild(homepageStyles);

  // Use one banner component across every primary page.
  const bannerStyles = document.createElement('link');
  bannerStyles.rel = 'stylesheet';
  bannerStyles.href = '/page-banner.css';
  document.head.appendChild(bannerStyles);

  const loadPhase1 = () => {
    const parts = [1, 2, 3, 4, 5, 6, 7].map((number) => `/phase1/part-${String(number).padStart(2, '0')}.txt`);
    Promise.all(parts.map(async (url) => {
      const response = await fetch(url, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`Could not load ${url}: ${response.status}`);
      return response.text();
    }))
      .then((sourceParts) => {
        const script = document.createElement('script');
        script.src = URL.createObjectURL(new Blob([sourceParts.join('')], { type: 'text/javascript' }));
        script.onload = () => URL.revokeObjectURL(script.src);
        document.head.appendChild(script);
      })
      .catch((error) => {
        console.error('Phase 1 loader failed:', error);
      });
  };

  const loadPageBanners = () => {
    const bannerScript = document.createElement('script');
    bannerScript.src = '/page-banner.js';
    bannerScript.async = false;
    bannerScript.onload = loadPhase1;
    bannerScript.onerror = loadPhase1;
    document.head.appendChild(bannerScript);
  };

  const loadHomepage = () => {
    const homepageScript = document.createElement('script');
    homepageScript.src = '/homepage-routing.js';
    homepageScript.async = false;
    homepageScript.onload = loadPageBanners;
    homepageScript.onerror = loadPageBanners;
    document.head.appendChild(homepageScript);
  };

  const structureScript = document.createElement('script');
  structureScript.src = '/site-structure.js';
  structureScript.async = false;
  structureScript.onload = loadHomepage;
  structureScript.onerror = loadHomepage;
  document.head.appendChild(structureScript);
})();
