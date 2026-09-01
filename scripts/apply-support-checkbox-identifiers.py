from pathlib import Path

path = Path('mobile.js')
text = path.read_text()
old = 'label.innerHTML = `<input class="support-area-checkbox" type="checkbox" value="${escapeAttribute(option.value)}"><span>${escapeHtml(supportLabel(option.textContent))}</span>`;'
new = 'label.innerHTML = `<input id="support-area-option-${index + 1}" name="support-area" class="support-area-checkbox" type="checkbox" value="${escapeAttribute(option.value)}"><span>${escapeHtml(supportLabel(option.textContent))}</span>`;'
count = text.count(old)
if count != 1:
    raise SystemExit(f'Expected one support checkbox template, found {count}')
path.write_text(text.replace(old, new, 1))
