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
    '/about',
    '/privacy',
    '/disclosure',
    '/admin',
    '/admin/activate',
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
test('makes the collection searchable and preserves direct source links', async ({ page }) => {
  await page.goto('/projects');
  await page.getByRole('textbox', { name: 'Search projects' }).fill('ZCode');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'ZCode' })).toBeVisible();
  await expect(page.getByText('1 discovery for “ZCode”')).toBeVisible();
  await page.locator('.discovery-card').click();
  await expect(page).toHaveURL(/\/projects\/zcode$/);
  await expect(page.getByRole('link', { name: 'Open repository' })).toHaveAttribute(
    'href',
    'https://github.com/zai-org/ZCode',
  );
  await expect(page.getByRole('link', { name: 'Original Instagram post' })).toHaveAttribute(
    'href',
    'https://www.instagram.com/reel/Ddi8zSrj9vx/',
  );
  await page.goto('/projects?q=no-match-for-this-project');
  await expect(
    page.getByRole('heading', { name: 'A different search might find it.' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Explore all projects' }).click();
  await expect(page.locator('.discovery-card')).toHaveCount(4);
});
test('supports navigation with an accessible mobile menu and current-page state', async ({
  page,
}) => {
  await page.goto('/');
  const mobile = (page.viewportSize()?.width || 1280) <= 800;
  if (mobile) {
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Close menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  }
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Toolbox' })
    .click();
  await expect(page).toHaveURL(/\/tools$/);
  if (mobile) {
    await expect(page.getByRole('button', { name: 'Menu', exact: true })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
  }
  const active = page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Toolbox' });
  await expect(active).toHaveAttribute('aria-current', 'page');
  if (mobile) {
    await active.focus();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Menu', exact: true })).toBeFocused();
    await expect(page.getByRole('button', { name: 'Menu', exact: true })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  }
});
test('keeps invitation tokens out of requests and waits for an explicit password submission', async ({
  page,
}) => {
  const posts: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/admin/activate')) posts.push(request.method());
  });
  await page.goto(
    '/admin/activate#token_hash=' + 'a'.repeat(64) + '&type=invite&next=https://attacker.example',
  );
  await expect(page.getByRole('button', { name: 'Save password' })).toBeVisible();
  expect(new URL(page.url()).hash).toBe('');
  expect(posts).toEqual([]);
  await page.getByLabel('New password', { exact: true }).fill('a new unique password');
  await page
    .getByLabel('Confirm new password', { exact: true })
    .fill('a different unique password');
  await page.getByRole('button', { name: 'Save password' }).click();
  await expect(page.locator('p[role="alert"]')).toHaveText('The passwords do not match.');
  expect(posts).toEqual([]);
  await expect(page).toHaveURL(/\/admin\/activate$/);
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
