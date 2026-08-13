(() => {
  const items = [
    ['support-filter', 'Support area', 'Based on the types of help an organization says it provides. A resource may appear in more than one support area.'],
    ['area-filter', 'Local area', 'Charlotte / Mecklenburg means located in or clearly serving Mecklenburg County. Surrounding communities are generally within about 30 road miles of Uptown Charlotte. Statewide / national options serve a broader area.'],
    ['foster-filter', 'Foster-care relevance', 'Foster-care specific programs explicitly serve current or former foster youth. Partially specific programs serve young people and may include foster youth but are not exclusive to them. General resources have no foster-care-specific focus.'],
    ['priority-filter', 'Referral priority', 'Core is a strong first place to look. Specialized is useful for a narrower situation. Backup is a secondary option. Needs verification may be useful, but important details should be confirmed before referral.'],
    ['sort-select', 'Sort', 'Recommended orders Core, Specialized, Backup and Needs verification, then foster-care relevance, then name. Recently verified uses the date FARM127 last reviewed the listing.']
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
      button.setAttribute('aria-label', `How ${labelText.toLowerCase()} is classified`);
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
