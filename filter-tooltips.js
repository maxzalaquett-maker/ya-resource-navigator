(() => {
  const items = [
    ['support-filter', 'What do you need help with?', 'Choose the type of help you are looking for. Some programs appear under more than one type.'],
    ['area-filter', 'Where can you get help?', 'Charlotte / Mecklenburg programs serve Mecklenburg County. Nearby programs are usually within about 30 miles of Uptown Charlotte. Statewide / national programs cover a larger area.'],
    ['foster-filter', 'Foster care experience', 'Choose “Made for people with foster care experience” to see programs created for current or former foster youth. Choose “May help after foster care” for broader youth programs that may also fit.'],
    ['priority-filter', 'Where to start', '“Best place to start” means the program may be a strong first option. “For specific situations” fits a narrower need. “Try this next” is another option when the first one cannot help.'],
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
