(() => {
  'use strict';

  function onReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  }

  function addSharedClasses(banner, inner, copy, note) {
    if (!banner || !inner || !copy) return;
    banner.classList.add('page-banner');
    inner.classList.add('page-banner-inner');
    copy.classList.add('page-banner-copy');
    if (note) note.classList.add('page-banner-note');
    else inner.classList.add('page-banner-single');
  }

  function standardizeHomeTypography() {
    document.querySelectorAll('#view-home .home-section-heading').forEach((heading) => {
      heading.classList.add('help-section-heading');
    });

    document.querySelectorAll('#view-home .home-path-card').forEach((card) => {
      const copy = card.querySelector(':scope > span:nth-child(2)');
      if (!copy) return;
      copy.classList.add('home-path-copy');

      const legacyTitle = copy.querySelector(':scope > strong');
      if (!legacyTitle) return;

      const heading = document.createElement('h3');
      heading.className = 'home-path-title';
      heading.textContent = legacyTitle.textContent;
      legacyTitle.replaceWith(heading);
    });
  }

  function standardizeHomeBanner() {
    const banner = document.querySelector('#view-home .home-hero');
    const inner = banner?.querySelector('.home-hero-grid');
    const copy = inner?.firstElementChild;
    const note = inner?.querySelector('.home-audience-card');
    addSharedClasses(banner, inner, copy, note);
    standardizeHomeTypography();
  }

  function standardizeDirectoryBanner() {
    const banner = document.querySelector('#view-directory .hero');
    const inner = banner?.querySelector('.hero-grid');
    const copy = inner?.firstElementChild;
    const note = inner?.querySelector('.hero-note');
    addSharedClasses(banner, inner, copy, note);
  }

  function standardizeSimpleBanner(view) {
    const heading = view?.querySelector(':scope > .page-heading');
    if (!heading) return;

    if (!heading.closest('.page-banner')) {
      const banner = document.createElement('div');
      banner.className = 'page-banner';
      heading.insertAdjacentElement('beforebegin', banner);
      banner.appendChild(heading);
    }

    heading.classList.add('page-banner-inner', 'page-banner-single');
    heading.classList.remove('narrow');

    if (!heading.querySelector(':scope > .page-banner-copy')) {
      const copy = document.createElement('div');
      copy.className = 'page-banner-copy';
      while (heading.firstChild) copy.appendChild(heading.firstChild);
      heading.appendChild(copy);
    }
  }

  function standardizePageBanners() {
    standardizeHomeBanner();
    standardizeDirectoryBanner();

    ['urgent', 'foster', 'about', 'needs', 'partners'].forEach((viewName) => {
      standardizeSimpleBanner(document.getElementById(`view-${viewName}`));
    });
  }

  onReady(() => {
    standardizePageBanners();

    const main = document.getElementById('main-content');
    if (!main) return;

    const observer = new MutationObserver(standardizePageBanners);
    observer.observe(main, { childList: true, subtree: true });
  });
})();
