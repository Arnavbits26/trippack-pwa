import { expect, test, type Page } from '@playwright/test';

async function createTrip(page: Page, name = 'Bali escape', destination = 'Ubud, Bali', days = '3') {
  await page.getByLabel('Trip name').fill(name);
  await page.getByLabel('Destination').fill(destination);
  await page.getByLabel('Days').fill(days);
  await page.getByRole('button', { name: 'Create trip' }).click();
  await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
}

async function addActivity(page: Page, title: string, day: string, time: string, type: string) {
  await page.getByLabel('Day', { exact: true }).selectOption(day);
  await page.getByLabel('Time').fill(time);
  await page.getByLabel('Type').selectOption(type);
  await page.getByLabel('Activity title').fill(title);
  await page.getByRole('button', { name: 'Add activity' }).click();
  await expect(page.getByText(title, { exact: false }).first()).toBeVisible();
}

/** Waits until the service worker is installed and controlling this page. */
async function waitForServiceWorker(page: Page) {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
}

test.describe('core flows', () => {
  test('shows an empty state, then creates a trip', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'TripPack' })).toBeVisible();
    await expect(page.getByText('No trips yet')).toBeVisible();
    await createTrip(page);
  });

  test('validates the new-trip form', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Create trip' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'trip name' })).toBeVisible();
    await page.getByLabel('Trip name').fill('x');
    await page.getByLabel('Destination').fill('y');
    await page.getByLabel('Days').fill('40');
    await page.getByRole('button', { name: 'Create trip' }).click();
    await expect(page.getByRole('alert').filter({ hasText: '1 to 14' })).toBeVisible();
  });

  test('adds activities in time order and filters them by text and type', async ({ page }) => {
    await page.goto('/');
    await createTrip(page);
    await addActivity(page, 'Museum visit', '1', '15:00', 'activity');
    await addActivity(page, 'Airport pickup', '1', '09:30', 'transport');
    const day1 = page.getByRole('region', { name: /Day 1/ });
    const items = day1.getByRole('listitem');
    await expect(items.first()).toContainText('Airport pickup');
    await expect(items.nth(1)).toContainText('Museum visit');

    await page.getByLabel('Search activities').fill('museum');
    await expect(day1.getByRole('listitem')).toHaveCount(1);
    await page.getByLabel('Search activities').fill('');
    await page.getByLabel('Show').selectOption('transport');
    await expect(day1.getByRole('listitem')).toHaveCount(1);
    await expect(day1).toContainText('Airport pickup');
  });

  test('keeps data after a reload', async ({ page }) => {
    await page.goto('/');
    await createTrip(page, 'Persistent trip');
    await page.getByLabel('New packing item').fill('Passport');
    await page.getByRole('button', { name: 'Add item' }).click();
    await page.reload();
    await expect(page.getByRole('heading', { level: 2, name: 'Persistent trip' })).toBeVisible();
    await expect(page.getByText('Passport')).toBeVisible();
  });

  test('is usable with the keyboard only', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Trip name').focus();
    await page.keyboard.type('Keyboard trip');
    await page.keyboard.press('Tab');
    await page.keyboard.type('Lisbon');
    await page.keyboard.press('Enter'); // submits the form
    await expect(page.getByRole('heading', { level: 2, name: 'Keyboard trip' })).toBeVisible();
  });

  test('has no horizontal scrolling on a small phone screen', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('/');
    await createTrip(page);
    await addActivity(page, 'A very long activity title to test that text wraps instead of overflowing the screen', '1', '10:00', 'food');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('PWA behaviour', () => {
  test('manifest is complete and its icons load', async ({ page, request }) => {
    await page.goto('/');
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    const manifestUrl = new URL(href!, page.url()).href;
    const manifest = await (await request.get(manifestUrl)).json();
    expect(manifest).toMatchObject({ short_name: 'TripPack', display: 'standalone' });
    expect(manifest.start_url).toBeTruthy();
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
    expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']));
    expect(manifest.icons.some((i: { purpose: string }) => i.purpose === 'maskable')).toBe(true);
    for (const icon of manifest.icons) {
      const res = await request.get(new URL(icon.src, manifestUrl).href);
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type']).toContain('image/png');
    }
  });

  test('service worker installs, controls the page and precaches the app shell', async ({ page }) => {
    await page.goto('/');
    await waitForServiceWorker(page);
    const cached = await page.evaluate(async () => {
      const names = (await caches.keys()).filter((n) => n.startsWith('trippack-precache-'));
      const cache = await caches.open(names[0]);
      return { cacheCount: names.length, urls: (await cache.keys()).map((r) => new URL(r.url).pathname) };
    });
    expect(cached.cacheCount).toBe(1);
    expect(cached.urls.some((u) => u.endsWith('/index.html'))).toBe(true);
    expect(cached.urls.some((u) => /\/assets\/index-.*\.js$/.test(u))).toBe(true);
    expect(cached.urls.some((u) => /\/assets\/TripView-.*\.js$/.test(u))).toBe(true);
    expect(cached.urls.some((u) => u.endsWith('/manifest.webmanifest'))).toBe(true);
  });

  test('chromium reports the app as installable (no installability errors)', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Page.getInstallabilityErrors is a Chromium DevTools call');
    await page.goto('/');
    await waitForServiceWorker(page);
    const cdp = await context.newCDPSession(page);
    const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors');
    expect(installabilityErrors).toEqual([]);
  });

  test('works fully offline, including a trip deep link and saved data', async ({ page, context }) => {
    await page.goto('/');
    await waitForServiceWorker(page);
    await createTrip(page, 'Offline trip');
    await addActivity(page, 'Ferry to Nusa Penida', '2', '07:30', 'transport');
    const deepLink = page.url();

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { level: 2, name: 'Offline trip' })).toBeVisible();
    await expect(page.getByText('Ferry to Nusa Penida')).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: "You're offline" })).toBeVisible();

    // A fresh navigation to the deep link while offline is served from the cache too.
    await page.goto('about:blank');
    await page.goto(deepLink);
    await expect(page.getByRole('heading', { level: 2, name: 'Offline trip' })).toBeVisible();

    // The app still works while offline: add data, then go back online.
    await page.getByLabel('New packing item').fill('Sunscreen');
    await page.getByRole('button', { name: 'Add item' }).click();
    await expect(page.getByText('Sunscreen')).toBeVisible();
    await context.setOffline(false);
    await expect(page.getByRole('status').filter({ hasText: "You're offline" })).toHaveCount(0);
  });
});

test.describe('accessibility basics', () => {
  test('has a language, one h1, a skip link and labelled controls', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeAttached();
    const unlabeled = await page.evaluate(() =>
      [...document.querySelectorAll('input, select')].filter((el) => {
        const e = el as HTMLInputElement;
        return !(e.labels && e.labels.length) && !e.getAttribute('aria-label');
      }).length,
    );
    expect(unlabeled).toBe(0);
  });
});
