const { test, expect } = require('@playwright/test');

async function resetBrowserStorage(page) {
  await page.goto('/#home');
  await page.evaluate(() => localStorage.clear());
}

async function waitForApplication(page) {
  await expect(page.locator('html')).toHaveClass(/rn-ready/);
  await expect(page.locator('#result-count')).not.toContainText('Loading resources');
}

function capturePageErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test('keeps native platform methods intact', async ({ page }) => {
  await page.goto('/#directory');
  await waitForApplication(page);

  const matcherState = await page.evaluate(() => ({
    filterLoaded: Boolean(window.ResourceFilter),
    routeLoaded: Boolean(window.ResourceRoute),
    arrayIncludesIsNative: /\[native code\]/.test(Array.prototype.includes.toString()),
    stringIncludesIsNative: /\[native code\]/.test(String.prototype.includes.toString()),
    pushStateIsNative: /\[native code\]/.test(history.pushState.toString()),
    replaceStateIsNative: /\[native code\]/.test(history.replaceState.toString())
  }));

  expect(matcherState).toEqual({
    filterLoaded: true,
    routeLoaded: true,
    arrayIncludesIsNative: true,
    stringIncludesIsNative: true,
    pushStateIsNative: true,
    replaceStateIsNative: true
  });
});

test('loads Phase 1 without runtime source assembly', async ({ page }) => {
  const pageErrors = capturePageErrors(page);
  const requestedPaths = [];
  page.on('request', (request) => {
    try {
      requestedPaths.push(new URL(request.url()).pathname);
    } catch {
      // Ignore non-standard request URLs from the browser runtime.
    }
  });

  await page.goto('/#home');
  await waitForApplication(page);
  await expect(page.locator('#phase1-guided')).toHaveCount(1);

  const deliveryState = await page.evaluate(() => ({
    blobScriptCount: [...document.scripts].filter((script) => script.src.startsWith('blob:')).length,
    phase1ScriptCount: [...document.scripts].filter((script) => {
      try {
        return new URL(script.src, window.location.href).pathname === '/phase1.js';
      } catch {
        return false;
      }
    }).length
  }));

  expect(deliveryState).toEqual({ blobScriptCount: 0, phase1ScriptCount: 1 });
  expect(requestedPaths.some((path) => path.startsWith('/phase1/part-'))).toBe(false);
  expect(pageErrors).toEqual([]);
});

test('loads the home page and supports the primary directory journey', async ({ page }) => {
  const pageErrors = capturePageErrors(page);
  await resetBrowserStorage(page);
  await page.reload();
  await waitForApplication(page);

  await expect(page.locator('#view-home')).toBeVisible();
  await expect(page.locator('main#main-content')).toHaveCount(1);

  await page.locator('.nav-tab[data-view="directory"]').click();
  await expect(page.locator('#view-directory')).toBeVisible();
  await expect(page).toHaveURL(/#directory$/);

  const cards = page.locator('#resource-grid .resource-card');
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThan(0);

  const firstProgramName = (await cards.first().locator('h2').innerText()).trim();
  const search = page.locator('#search-input-visible');
  await expect(search).toBeVisible();
  await search.fill(firstProgramName);

  await expect.poll(async () => cards.count()).toBeGreaterThan(0);
  await expect(cards.first().locator('h2')).toHaveText(firstProgramName);

  await cards.first().locator('[data-action="details"]').click();
  await expect(page.locator('#resource-dialog')).toBeVisible();
  await expect(page.locator('#dialog-content h2')).toHaveText(firstProgramName);

  expect(pageErrors).toEqual([]);
});


test('uses browser history for view navigation while replacing filter state', async ({ page }) => {
  const pageErrors = capturePageErrors(page);
  await page.goto('/#home');
  await waitForApplication(page);
  await expect(page.locator('#view-home')).toBeVisible();

  await page.locator('.nav-tab[data-view="directory"]').click();
  await expect(page.locator('#view-directory')).toBeVisible();
  await expect(page).toHaveURL(/#directory$/);

  const search = page.locator('#search-input-visible');
  await search.fill('housing');
  await expect.poll(() => new URL(page.url()).searchParams.has('q')).toBe(true);

  await page.locator('.nav-tab[data-view="about"]').click();
  await expect(page.locator('#view-about')).toBeVisible();
  await expect(page).toHaveURL(/#about$/);

  await page.goBack();
  await expect(page.locator('#view-directory')).toBeVisible();
  await expect(search).toHaveValue('housing');

  await page.goBack();
  await expect(page.locator('#view-home')).toBeVisible();
  await expect(page).toHaveURL(/#home$/);

  await page.goForward();
  await expect(page.locator('#view-directory')).toBeVisible();
  await expect(page.locator('#search-input-visible')).toHaveValue('housing');

  expect(pageErrors).toEqual([]);
});

test('restores a directory filter from a shared URL', async ({ page }) => {
  const pageErrors = capturePageErrors(page);
  await page.goto('/?support=Housing%20%2F%20homelessness#directory');
  await waitForApplication(page);

  await expect(page.locator('#view-directory')).toBeVisible();
  await expect(page.locator('input.support-area-checkbox[value="Housing / homelessness"]')).toBeChecked();
  await expect(page.locator('#active-filters')).toContainText('Housing');
  await expect(page.locator('#resource-grid .resource-card').first()).toBeVisible();

  expect(pageErrors).toEqual([]);
});

test('persists a saved program after reload', async ({ page }) => {
  const pageErrors = capturePageErrors(page);
  await page.goto('/#directory');
  await waitForApplication(page);
  await expect(page.locator('#view-directory')).toBeVisible();

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await waitForApplication(page);
  await expect(page.locator('#view-directory')).toBeVisible();

  const firstCard = page.locator('#resource-grid .resource-card').first();
  await expect(firstCard).toBeVisible();
  const resourceId = await firstCard.getAttribute('data-resource-id');
  expect(resourceId).toBeTruthy();

  await firstCard.locator('[data-action="details"]').click();
  const dialog = page.locator('#resource-dialog');
  await expect(dialog).toBeVisible();
  await dialog.locator('[data-dialog-action="save"]').click();

  await expect.poll(async () => page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem('farm127-saved-resources') || '[]').map(String);
    } catch {
      return [];
    }
  })).toContain(String(resourceId));

  await page.reload();
  await waitForApplication(page);
  await expect(page.locator('#view-directory')).toBeVisible();

  await page.locator(`[data-resource-id="${resourceId}"] [data-action="details"]`).click();
  await expect(page.locator('#resource-dialog [data-dialog-action="save"]')).toHaveText('Remove from my plan');

  expect(pageErrors).toEqual([]);
});


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

test.describe('mobile interface', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('opens the section menu and directory filters', async ({ page }) => {
    const pageErrors = capturePageErrors(page);
    await page.goto('/#directory');
    await waitForApplication(page);

    const navigationToggle = page.locator('#mobile-nav-toggle');
    await expect(navigationToggle).toBeVisible();
    await navigationToggle.click();
    await expect(navigationToggle).toHaveAttribute('aria-expanded', 'true');

    await page.locator('.nav-tab[data-view="about"]').click();
    await expect(page.locator('#view-about')).toBeVisible();
    await expect(navigationToggle).toHaveAttribute('aria-expanded', 'false');

    await navigationToggle.click();
    await page.locator('.nav-tab[data-view="directory"]').click();
    await expect(page.locator('#view-directory')).toBeVisible();

    const filterToggle = page.locator('#mobile-filter-toggle');
    await expect(filterToggle).toBeVisible();
    await filterToggle.click();
    await expect(filterToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#directory-filters')).toHaveClass(/mobile-filter-open/);

    expect(pageErrors).toEqual([]);
  });
});
