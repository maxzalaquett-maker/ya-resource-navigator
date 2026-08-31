(() => {
  'use strict';

  const CATEGORIES = [
    {
      id: 'all',
      label: 'All programs',
      icon: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"></path>'
    },
    {
      id: 'housing',
      label: 'Housing',
      icon: '<path d="m3 11 9-7 9 7"></path><path d="M5 10v10h14V10"></path><path d="M9 20v-6h6v6"></path>'
    },
    {
      id: 'transition',
      label: 'Transition support',
      icon: '<circle cx="12" cy="12" r="9"></circle><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8z"></path>'
    },
    {
      id: 'healthcare',
      label: 'Healthcare',
      icon: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8z"></path>'
    },
    {
      id: 'education',
      label: 'Education & aid',
      icon: '<path d="m3 10 9-5 9 5-9 5z"></path><path d="M7 12.5V17c3 2 7 2 10 0v-4.5"></path><path d="M21 10v6"></path>'
    },
    {
      id: 'career',
      label: 'Jobs & career',
      icon: '<rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2"></path>'
    },
    {
      id: 'legal',
      label: 'Legal help',
      icon: '<path d="M6 3h9l3 3v15H6z"></path><path d="M15 3v4h4M9 12h6M9 16h6"></path>'
    },
    {
      id: 'mentorship',
      label: 'Mentoring & community',
      icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"></path>'
    }
  ];

  let programs = [];
  let selectedCategory = 'all';
  let controls;
  let summary;

  function onReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  }

  function init(attempt = 0) {
    const tableContainer = document.getElementById('foster-table');
    if (!tableContainer) {
      if (attempt < 40) window.setTimeout(() => init(attempt + 1), 100);
      return;
    }

    fetch('data/app-data.json', { cache: 'no-cache' })
      .then((response) => {
        if (!response.ok) throw new Error(`Resource data returned ${response.status}`);
        return response.json();
      })
      .then((data) => {
        programs = Array.isArray(data?.fosterPrograms) ? data.fosterPrograms : [];
        buildControls(tableContainer);
        waitForRows(tableContainer);
      })
      .catch((error) => {
        console.error('Foster category filters could not be loaded:', error);
      });
  }

  function buildControls(tableContainer) {
    if (document.getElementById('foster-category-filter')) return;

    controls = document.createElement('section');
    controls.id = 'foster-category-filter';
    controls.className = 'foster-category-filter';
    controls.setAttribute('aria-labelledby', 'foster-category-heading');

    const heading = document.createElement('h2');
    heading.id = 'foster-category-heading';
    heading.className = 'foster-category-heading';
    heading.textContent = 'Filter programs by service';

    const help = document.createElement('p');
    help.className = 'foster-category-help';
    help.textContent = 'Programs may appear in more than one category.';

    const group = document.createElement('div');
    group.className = 'foster-category-chips';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Foster care service categories');

    CATEGORIES.forEach((category) => {
      const count = category.id === 'all'
        ? programs.length
        : programs.filter((program) => categoryList(program).includes(category.id)).length;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'foster-category-chip';
      button.dataset.fosterCategory = category.id;
      button.setAttribute('aria-pressed', category.id === selectedCategory ? 'true' : 'false');
      button.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${category.icon}</svg>
        <span>${escapeHtml(category.label)}</span>
        <span class="foster-category-count" aria-label="${count} programs">${count}</span>`;
      button.addEventListener('click', () => selectCategory(category.id));
      group.appendChild(button);
    });

    summary = document.createElement('p');
    summary.className = 'foster-category-summary';
    summary.setAttribute('aria-live', 'polite');

    controls.append(heading, help, group, summary);
    tableContainer.before(controls);
  }

  function waitForRows(tableContainer, attempt = 0) {
    const rows = tableContainer.querySelectorAll('tbody tr');
    if (rows.length) {
      render(rows);
      return;
    }

    if (attempt < 50) window.setTimeout(() => waitForRows(tableContainer, attempt + 1), 100);
  }

  function selectCategory(categoryId) {
    selectedCategory = CATEGORIES.some((category) => category.id === categoryId) ? categoryId : 'all';
    const rows = document.querySelectorAll('#foster-table tbody tr');
    render(rows);
  }

  function render(rows) {
    const visibleNames = new Set(
      programs
        .filter((program) => selectedCategory === 'all' || categoryList(program).includes(selectedCategory))
        .map((program) => program.program)
    );

    rows.forEach((row) => {
      const programName = row.querySelector('td')?.textContent.trim() || '';
      row.hidden = !visibleNames.has(programName);
    });

    document.querySelectorAll('[data-foster-category]').forEach((button) => {
      const active = button.dataset.fosterCategory === selectedCategory;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    const category = CATEGORIES.find((item) => item.id === selectedCategory) || CATEGORIES[0];
    const count = visibleNames.size;
    summary.textContent = selectedCategory === 'all'
      ? `Showing all ${count} foster-care programs.`
      : `Showing ${count} ${category.label.toLowerCase()} program${count === 1 ? '' : 's'}.`;
  }

  function categoryList(program) {
    return Array.isArray(program?.categories) ? program.categories : [];
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  onReady(init);
})();
