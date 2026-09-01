from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file_path = Path(path)
    text = file_path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"Expected one match in {path}, found {count}: {old[:80]!r}")
    file_path.write_text(text.replace(old, new, 1))


replace_once(
    "phase1.js",
    '<label class="field"><span>Status</span><select data-plan-status="${escapeAttribute(resource.id)}">',
    '<label class="field" for="plan-status-${escapeAttribute(encodeURIComponent(String(resource.id)))}"><span>Status</span><select id="plan-status-${escapeAttribute(encodeURIComponent(String(resource.id)))}" name="plan-status-${escapeAttribute(encodeURIComponent(String(resource.id)))}" data-plan-status="${escapeAttribute(resource.id)}">',
)
replace_once(
    "phase1.js",
    '<label class="field"><span>Check back on</span><input type="date" data-plan-date="${escapeAttribute(resource.id)}" value="${escapeAttribute(meta.followUp || \'\')}"></label>',
    '<label class="field" for="plan-follow-up-${escapeAttribute(encodeURIComponent(String(resource.id)))}"><span>Check back on</span><input id="plan-follow-up-${escapeAttribute(encodeURIComponent(String(resource.id)))}" name="plan-follow-up-${escapeAttribute(encodeURIComponent(String(resource.id)))}" type="date" data-plan-date="${escapeAttribute(resource.id)}" value="${escapeAttribute(meta.followUp || \'\')}"></label>',
)
replace_once(
    "logos.js",
    "    image.alt = '';\n    image.loading = 'lazy';",
    "    image.alt = '';\n    image.width = 32;\n    image.height = 32;\n    image.loading = 'lazy';",
)

TEST_BLOCK = r'''

test('provides identifiers for form fields and dimensions for lazy images', async ({ page }) => {
  const pageErrors = capturePageErrors(page);
  await page.goto('/#directory');
  await waitForApplication(page);
  await expect(page.locator('#view-directory')).toBeVisible();

  const cards = page.locator('#resource-grid .resource-card');
  await expect(cards.first()).toBeVisible();
  await expect.poll(async () => page.locator('img[loading="lazy"]').count()).toBeGreaterThan(0);

  const imageAudit = await page.locator('img[loading="lazy"]').evaluateAll((images) => ({
    count: images.length,
    missingDimensions: images
      .filter((image) => Number(image.getAttribute('width')) <= 0 || Number(image.getAttribute('height')) <= 0)
      .map((image) => image.currentSrc || image.src || '(no source)')
  }));
  expect(imageAudit.count).toBeGreaterThan(0);
  expect(imageAudit.missingDimensions).toEqual([]);

  await cards.first().locator('[data-action="details"]').click();
  const dialog = page.locator('#resource-dialog');
  await expect(dialog).toBeVisible();
  await dialog.locator('[data-dialog-action="save"]').click();
  await page.locator('#dialog-close').click();

  await page.locator('[data-plan-jump]').click();
  await expect(page.locator('#view-needs')).toBeVisible();

  const planFields = page.locator('#phase1-plan-list input, #phase1-plan-list select, #phase1-plan-list textarea');
  await expect(planFields).toHaveCount(2);

  const fieldAudit = await page.locator('input, select, textarea').evaluateAll((fields) => ({
    unnamed: fields
      .filter((field) => !field.id && !field.getAttribute('name'))
      .map((field) => field.outerHTML),
    ids: fields.map((field) => field.id).filter(Boolean)
  }));
  expect(fieldAudit.unnamed).toEqual([]);
  expect(fieldAudit.ids.filter((id, index, ids) => ids.indexOf(id) !== index)).toEqual([]);
  expect(pageErrors).toEqual([]);
});
'''
replace_once(
    "tests/e2e/smoke.spec.js",
    "\ntest.describe('mobile interface', () => {",
    TEST_BLOCK + "\ntest.describe('mobile interface', () => {",
)
