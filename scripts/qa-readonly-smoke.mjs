import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:3013';
const ADMIN_PHONE = process.env.QA_ADMIN_PHONE || '0901234567';
const ADMIN_PASSWORD = process.env.QA_ADMIN_PASSWORD || 'Admin@123';

const publicRoutes = ['/', '/products', '/cart', '/account', '/news'];
const adminRoutes = [
  '/admin/dashboard',
  '/admin/products',
  '/admin/orders',
  '/admin/posts',
  '/admin/inventory',
  '/admin/settings',
];

const result = {
  publicRoutes: [],
  adminRoutes: [],
  consoleErrors: [],
  pageErrors: [],
  failedRequests: [],
};

function watch(page) {
  page.on('console', (message) => {
    if (message.type() === 'error') {
      result.consoleErrors.push({ url: page.url(), text: message.text().slice(0, 500) });
    }
  });
  page.on('pageerror', (error) => {
    result.pageErrors.push({ url: page.url(), message: error.message.slice(0, 500) });
  });
  page.on('response', (response) => {
    const url = response.url();
    if ((url.includes('/api/') || response.request().resourceType() === 'document') && response.status() >= 500) {
      result.failedRequests.push({ url, status: response.status() });
    }
  });
  page.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText || '';
    if (failure !== 'net::ERR_ABORTED') {
      result.failedRequests.push({ url: request.url(), failure });
    }
  });
}

async function openRoute(page, route) {
  const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  const body = await page.locator('body').innerText({ timeout: 10000 }).catch(() => '');
  return {
    route,
    status: response?.status() || 0,
    bodyLength: body.trim().length,
    title: await page.title(),
  };
}

async function adminLogin(page) {
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('input[type="tel"], input[name="phone"], input[placeholder*="điện thoại"]').first().fill(ADMIN_PHONE);
  await page.locator('input[type="password"]').first().fill(ADMIN_PASSWORD);
  await page.locator('button[type="submit"], button:has-text("Đăng nhập")').first().click();
  await page.waitForURL(/\/admin(\/dashboard)?/, { timeout: 20000 });
}

async function main() {
  const cachedChromium = join(
    homedir(),
    'Library/Caches/ms-playwright/chromium-1208/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
  );
  const browser = await chromium.launch({
    headless: true,
    executablePath: existsSync(cachedChromium) ? cachedChromium : undefined,
  });
  const context = await browser.newContext({ viewport: { width: 1366, height: 820 } });
  const page = await context.newPage();
  watch(page);

  for (const route of publicRoutes) {
    result.publicRoutes.push(await openRoute(page, route));
  }

  await adminLogin(page);
  for (const route of adminRoutes) {
    result.adminRoutes.push(await openRoute(page, route));
  }

  await browser.close();
  console.log(JSON.stringify(result, null, 2));

  const routeFailures = [...result.publicRoutes, ...result.adminRoutes]
    .filter((route) => route.status >= 400 || route.bodyLength < 60);
  if (routeFailures.length || result.consoleErrors.length || result.pageErrors.length || result.failedRequests.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
