from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / 'app.js'
content = path.read_text(encoding='utf-8')
old = """    document.querySelectorAll('[data-view]').forEach((button) => {
      button.addEventListener('click', () => {
        syncStateFromControls();
        routeState.navigate(button.dataset.view, buildUrlParams());
      });
    });"""
new = """    document.querySelectorAll('[data-view]').forEach((button) => {
      button.addEventListener('click', () => {
        const currentRoute = routeState.current();
        if (currentRoute.view === 'home') {
          routeState.navigate(button.dataset.view, new URLSearchParams());
          return;
        }

        syncStateFromControls();
        const params = buildUrlParams();
        routeState.replace(currentRoute.view, params, { notify: false });
        routeState.navigate(button.dataset.view, params);
      });
    });"""
if content.count(old) != 1:
    raise RuntimeError(f'Expected one navigation handler, found {content.count(old)}')
path.write_text(content.replace(old, new, 1), encoding='utf-8')
print('History entry snapshot fix applied.')
