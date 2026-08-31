(() => {
  'use strict';

  let updateQueued = false;
  let observer;

  function onReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  }

  function init(attempt = 0) {
    const panel = document.querySelector('#view-directory .filter-panel');
    if (!panel) {
      if (attempt < 60) window.setTimeout(() => init(attempt + 1), 100);
      return;
    }

    normalizeRows();
    document.getElementById('filter-shortcuts')?.remove();

    panel.addEventListener('input', queueUpdate);
    panel.addEventListener('change', queueUpdate);

    observer = new MutationObserver(queueUpdate);
    observer.observe(panel, { childList: true, subtree: true, characterData: true });
  }

  function queueUpdate() {
    if (updateQueued) return;
    updateQueued = true;
    window.requestAnimationFrame(() => {
      updateQueued = false;
      document.getElementById('filter-shortcuts')?.remove();
      normalizeRows();
    });
  }

  function normalizeRows() {
    document.querySelectorAll('#view-directory .filter-option-with-icon').forEach((text) => {
      const icon = text.querySelector(':scope > .filter-option-icon');
      let copy = text.querySelector(':scope > .filter-option-copy');

      if (!copy) {
        copy = document.createElement('span');
        copy.className = 'filter-option-copy';
        text.appendChild(copy);
      }

      [...text.childNodes].forEach((node) => {
        if (node === copy || node === icon) return;
        copy.appendChild(node);
      });

      const count = text.querySelector('.filter-result-count');
      if (count && count.parentNode !== copy) {
        copy.append(' ', count);
      }

      if (icon && text.firstElementChild !== icon) {
        text.prepend(icon);
      }
    });
  }

  onReady(() => init());
})();
