(() => {
  'use strict';

  const DESCRIPTION_SELECTOR = [
    '.resource-card .trigger',
    '.phase1-pathway-resource > p',
    '.phase1-plan-item-main > p:not(.phase1-plan-action)'
  ].join(',');

  let scheduled = false;

  function secondPersonClause(value) {
    return String(value || '')
      .replace(/\bis\b/gi, 'are')
      .replace(/\bwas\b/gi, 'were')
      .replace(/\bhas\b/gi, 'have')
      .replace(/\bwants\b/gi, 'want')
      .replace(/\bneeds\b/gi, 'need');
  }

  function contextualize(value) {
    let text = String(value || '').trim();
    if (!text) return text;

    // The earlier plain-language layer changed “a young adult who …” into
    // “a people who …”. Restore direct, grammatically correct wording.
    let match = text.match(/^A people who (.+?) (needs|wants|has|lacks) (.+)$/i);
    if (match) {
      const clause = secondPersonClause(match[1]);
      const verb = match[2].toLowerCase();
      const action = {
        needs: 'need',
        wants: 'want',
        has: 'have',
        lacks: 'do not have'
      }[verb];
      text = `You ${clause} and ${action} ${match[3]}`;
    }

    match = text.match(/^A people ages? ([0-9]+(?:\s*[–—-]\s*[0-9]+)?) (needs|wants) (.+)$/i);
    if (match) {
      text = `You are ${match[1]} and ${match[2].toLowerCase() === 'needs' ? 'need' : 'want'} ${match[3]}`;
    }

    return text
      .replace(/^A people who\b/i, 'A young adult who')
      .replace(/^A people ages\b/i, 'A young adult ages')
      .replace(/^People who are or were in foster care\b/i, 'Young adults who are or were in foster care')
      .replace(/^People in or formerly in foster care\b/i, 'Young adults in or formerly in foster care')
      .replace(/^People ages\b/i, 'Young adults ages')
      .replace(/\bpeople who are or were in foster care\b/gi, 'young adults who are or were in foster care')
      .replace(/\bpeople in or formerly in foster care\b/gi, 'young adults in or formerly in foster care')
      .replace(/\bpeople with foster care experience\b/gi, 'young adults with foster care experience')
      .replace(/\bpeople with similar experiences\b/gi, 'others with similar experiences')
      .replace(/\bsupport people\b/gi, 'someone supporting you')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function updateDescription(element) {
    if (!element || element.children.length || element.childNodes.length !== 1) return;
    const current = element.textContent.trim();
    const updated = contextualize(current);
    if (updated && updated !== current) element.firstChild.data = updated;
  }

  function scan(root = document) {
    if (root instanceof Element && root.matches(DESCRIPTION_SELECTOR)) updateDescription(root);
    root.querySelectorAll?.(DESCRIPTION_SELECTOR).forEach(updateDescription);
  }

  function scheduleScan() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      scan();
    });
  }

  function init() {
    scan();
    new MutationObserver(scheduleScan).observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
