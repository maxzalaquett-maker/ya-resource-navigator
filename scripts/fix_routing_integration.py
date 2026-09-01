from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding='utf-8')


def write(path: str, content: str) -> None:
    (ROOT / path).write_text(content, encoding='utf-8')


def replace_once(content: str, old: str, new: str, label: str) -> str:
    count = content.count(old)
    if count != 1:
        raise RuntimeError(f'Expected one {label} match, found {count}')
    return content.replace(old, new, 1)


config = read('config.js')
marker = 'window.RESOURCE_NAVIGATOR_CONFIG = {'
marker_index = config.find(marker)
if marker_index < 0:
    raise RuntimeError('Could not find resource navigator config marker')
config = config[marker_index:]
write('config.js', config)

app = read('app.js')
app = replace_once(
    app,
    "    document.querySelectorAll('[data-view]').forEach((button) => {\n      button.addEventListener('click', () => routeState.navigate(button.dataset.view, buildUrlParams()));\n    });",
    "    document.querySelectorAll('[data-view]').forEach((button) => {\n      button.addEventListener('click', () => {\n        syncStateFromControls();\n        routeState.navigate(button.dataset.view, buildUrlParams());\n      });\n    });",
    'view navigation handler',
)
app = replace_once(
    app,
    "  function buildUrlParams() {\n    const params = new URLSearchParams();",
    "  function syncStateFromControls() {\n    if (!els.search) return;\n    state.query = els.search.value.trim();\n    state.support = els.support.value;\n    state.area = els.area.value;\n    state.foster = els.foster.value;\n    state.priority = els.priority.value;\n    state.savedOnly = els.savedOnly.checked;\n    state.sort = els.sort.value;\n  }\n\n  function buildUrlParams() {\n    const params = new URLSearchParams();",
    'control snapshot helper',
)
write('app.js', app)

print('Routing integration fixes applied.')
