(() => {
  'use strict';

  // The advanced checklist rewrites labels after the core app renders filter chips.
  // Avoid creating a new mutation when a label already has the requested text;
  // otherwise the observer can trigger itself indefinitely.
  function makeActiveFilterTextUpdatesIdempotent() {
    if (window.__RN_ACTIVE_FILTER_TEXT_PATCH__) return;

    const descriptor = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
    if (!descriptor?.get || !descriptor?.set || descriptor.configurable === false) return;

    window.__RN_ACTIVE_FILTER_TEXT_PATCH__ = true;
    Object.defineProperty(Node.prototype, 'textContent', {
      configurable: descriptor.configurable,
      enumerable: descriptor.enumerable,
      get: descriptor.get,
      set(value) {
        const nextValue = value == null ? '' : String(value);
        const insideActiveFilters = this.nodeType === Node.ELEMENT_NODE
          && typeof this.closest === 'function'
          && Boolean(this.closest('#active-filters'));

        if (insideActiveFilters && descriptor.get.call(this) === nextValue) return;
        descriptor.set.call(this, value);
      }
    });
  }

  makeActiveFilterTextUpdatesIdempotent();

  const items = [
    ['sort-select', 'Sort by', '“Where to start” puts likely first options at the top. “Recently checked” sorts by the date the program information was last reviewed.']
  ];

  function init() {
    items.forEach(([controlId, labelText, helpText]) => {
      const control = document.getElementById(controlId);
      const oldField = control && control.closest('label.field, label.sort-field');
      if (!control || !oldField) return;

      const field = document.createElement('div');
      field.className = oldField.className;

      const row = document.createElement('div');
      row.className = oldField.classList.contains('sort-field') ? 'sort-label-row' : 'field-label-row';

      const label = document.createElement('label');
      label.htmlFor = controlId;
      label.textContent = labelText;

      const tip = document.createElement('span');
      tip.className = 'info-tooltip';

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'info-tooltip-button';
      button.textContent = 'i';
      button.setAttribute('aria-label', `More about ${labelText.toLowerCase()}`);
      button.setAttribute('aria-expanded', 'false');

      const content = document.createElement('span');
      content.className = 'info-tooltip-content';
      content.setAttribute('role', 'tooltip');
      content.textContent = helpText;

      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const open = !tip.classList.contains('is-open');
        closeAll(tip);
        tip.classList.toggle('is-open', open);
        button.setAttribute('aria-expanded', String(open));
      });

      tip.append(button, content);
      row.append(label, tip);
      oldField.replaceWith(field);
      field.append(row, control);
    });

    document.addEventListener('click', () => closeAll());
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeAll();
    });
  }

  function closeAll(except) {
    document.querySelectorAll('.info-tooltip.is-open').forEach((tip) => {
      if (tip === except) return;
      tip.classList.remove('is-open');
      const button = tip.querySelector('.info-tooltip-button');
      if (button) button.setAttribute('aria-expanded', 'false');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
