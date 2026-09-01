(() => {
  'use strict';

  const DATA_URL = '/data/app-data.json';
  const FALLBACK_ICON_SERVICE = 'https://www.google.com/s2/favicons?sz=128&domain_url=';
  const INITIALS_ONLY_DOMAINS = new Set([
    'home4me.org'
  ]);
  const resourcesById = new Map();
  const resourcesByName = new Map();
  let activeResourceId = '';
  let observer;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  async function init() {
    try {
      const response = await fetch(DATA_URL, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`Resource data returned ${response.status}`);
      const data = await response.json();

      (data.resources || []).forEach((resource) => {
        resourcesById.set(String(resource.id), resource);
        resourcesByName.set(normalize(resource.name), resource);
      });

      document.addEventListener('click', rememberOpenedResource, true);
      enhanceLogos();

      observer = new MutationObserver(enhanceLogos);
      observer.observe(document.body, { childList: true, subtree: true });
    } catch (error) {
      console.warn('Organization logos could not be initialized.', error);
    }
  }

  function rememberOpenedResource(event) {
    const detailsButton = event.target.closest('[data-action="details"]');
    const card = detailsButton?.closest('[data-resource-id]');
    if (card) activeResourceId = String(card.dataset.resourceId || '');
  }

  function enhanceLogos() {
    enhanceCards();
    enhanceDialog();
  }

  function enhanceCards() {
    document.querySelectorAll('.resource-card[data-resource-id]:not([data-logo-enhanced])').forEach((card) => {
      const resource = resourcesById.get(String(card.dataset.resourceId));
      const heading = card.querySelector('h2');
      if (!resource || !heading) return;

      const brandRow = document.createElement('div');
      brandRow.className = 'resource-card-heading';
      brandRow.appendChild(createLogo(resource, 'card'));
      heading.before(brandRow);
      brandRow.appendChild(heading);
      card.dataset.logoEnhanced = 'true';
    });
  }

  function enhanceDialog() {
    const dialogTitle = document.querySelector('.dialog-title:not([data-logo-enhanced])');
    if (!dialogTitle) return;

    const heading = dialogTitle.querySelector('h2');
    if (!heading) return;

    const resource = resourcesById.get(activeResourceId) || resourcesByName.get(normalize(heading.textContent));
    if (!resource) return;

    const eyebrow = dialogTitle.querySelector('.eyebrow');
    const brandRow = document.createElement('div');
    const copy = document.createElement('div');
    brandRow.className = 'dialog-brand-row';
    copy.className = 'dialog-brand-copy';

    brandRow.appendChild(createLogo(resource, 'dialog'));
    if (eyebrow) copy.appendChild(eyebrow);
    copy.appendChild(heading);
    brandRow.appendChild(copy);
    dialogTitle.prepend(brandRow);
    dialogTitle.dataset.logoEnhanced = 'true';
  }

  function createLogo(resource, context) {
    const logo = document.createElement('span');
    const image = document.createElement('img');
    const fallback = document.createElement('span');
    const sourceUrl = safeHttpUrl(resource.sourceUrl);
    const domain = sourceUrl ? new URL(sourceUrl).hostname.replace(/^www\./, '') : '';
    const initialsOnly = INITIALS_ONLY_DOMAINS.has(domain);
    const overrides = window.RESOURCE_LOGO_OVERRIDES || {};
    const override = overrides[String(resource.id)] || overrides[resource.name] || overrides[domain] || '';
    const primaryUrl = initialsOnly ? '' : safeHttpUrl(override) || (sourceUrl ? `${new URL(sourceUrl).origin}/favicon.ico` : '');
    const fallbackUrl = initialsOnly || !sourceUrl ? '' : `${FALLBACK_ICON_SERVICE}${encodeURIComponent(sourceUrl)}`;

    logo.className = `resource-logo resource-logo-${context}`;
    logo.title = `${resource.name} logo`;

    fallback.className = 'resource-logo-initials';
    fallback.textContent = initials(resource.name);
    fallback.setAttribute('aria-hidden', 'true');

    image.alt = '';
    image.width = 32;
    image.height = 32;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.referrerPolicy = 'no-referrer';
    image.dataset.fallbackUrl = fallbackUrl;
    image.dataset.fallbackState = 'primary';

    image.addEventListener('error', () => {
      if (image.dataset.fallbackState === 'primary' && image.dataset.fallbackUrl) {
        image.dataset.fallbackState = 'service';
        image.src = image.dataset.fallbackUrl;
        return;
      }
      image.remove();
      logo.classList.add('uses-initials');
    });

    if (primaryUrl) {
      image.src = primaryUrl;
      logo.appendChild(image);
    } else {
      logo.classList.add('uses-initials');
    }

    logo.appendChild(fallback);
    return logo;
  }

  function initials(name) {
    const ignored = new Set(['the', 'a', 'an', 'and', 'of', 'for', 'to']);
    const words = String(name || '')
      .replace(/[^a-z0-9\s]/gi, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .filter((word) => !ignored.has(word.toLowerCase()));

    const selected = words.length ? words : ['R'];
    return selected.slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join('');
  }

  function safeHttpUrl(value) {
    if (!value) return '';
    try {
      const url = new URL(String(value), window.location.origin);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch (_error) {
      return '';
    }
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }
})();
