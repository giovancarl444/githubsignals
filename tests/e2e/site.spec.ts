import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('renders the discovery site without errors or horizontal overflow', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Less noise.');
  await expect(page.getByRole('link', { name: 'Find your next project' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('link', { name: 'Find your next project' }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(errors).toEqual([]);
});
test('supports keyboard navigation and accessible page structure', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => location.hash)).toBe('#main');
  const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(a11y.violations).toEqual([]);
});
test('serves real pages, metadata, and preview robots without fictional offers', async ({
  page,
  request,
}) => {
  for (const path of [
    '/tools',
    '/partners',
    '/privacy',
    '/disclosure',
    '/admin',
    '/subscribe/confirm',
    '/unsubscribe',
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.locator('main h1')).toBeVisible();
  }
  await page.goto('/');
  await expect(page.locator('meta[name="google-site-verification"]')).toHaveAttribute(
    'content',
    'u5pvagiREMdJGJ5wwPq2UDNXL4Pizuf38fjThYrP_k4',
  );
  expect((await request.get('/robots.txt')).status()).toBe(200);
  expect(await (await request.get('/robots.txt')).text()).toMatch(/^Disallow: \/$/m);
  await page.goto('/tools');
  await expect(page.locator('a[href^="/go/"]')).toHaveCount(0);
});
test('does not pretend to collect email before services are connected', async ({
  page,
  request,
  baseURL,
}) => {
  await page.goto('/');
  await expect(page.getByText('The weekly newsletter is opening soon.')).toBeVisible();
  const response = await request.post('/api/subscribe', {
    headers: { origin: baseURL! },
    data: { email: 'test@example.com', consent: true, turnstileToken: 'test' },
  });
  expect(response.status()).toBe(503);
  expect(await response.json()).toHaveProperty('error');
});
test('rejects arbitrary tracked redirects and protects exports', async ({ request }) => {
  const r = await request.get('/go/not-a-real-offer?url=https://evil.example', { maxRedirects: 0 });
  expect(r.status()).toBe(404);
  expect(r.headers().location).toBeUndefined();
  const exported = await request.get('/api/admin/export');
  expect([401, 403, 503]).toContain(exported.status());
  expect(exported.headers()['content-type']).not.toContain('text/csv');
});
