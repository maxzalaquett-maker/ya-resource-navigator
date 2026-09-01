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
  await resetBrowserStorage(page);
  await page.goto('/#directory');
  await waitForApplication(page);

  const firstCard = page.locator('#resource-grid .resource-card').first();
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

  await page.locator(`[data-resource-id="${resourceId}"] [data-action="details"]`).click();
  await expect(page.locator('#resource-dialog [data-dialog-action="save"]')).toHaveText('Remove from my plan');

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
