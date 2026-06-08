import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:3012';
const routes = [
  '/',
  '/products',
  '/products?category=tom',
  '/products?category=combo',
  '/products?search=tom',
  '/products/tom-su-size-l',
  '/cart',
  '/checkout',
  '/order-success',
  '/orders',
  '/account',
  '/login',
  '/register',
  '/admin',
];
const viewports = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'laptop-1366', width: 1366, height: 820 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
];

const result = {
  routes: [],
  flows: [],
  responsive: [],
  consoleErrors: [],
  pageErrors: [],
  failedRequests: [],
};

function severeConsole(message) {
  const text = message.text();
  return message.type() === 'error' && !/Failed to load resource: net::ERR_BLOCKED_BY_CLIENT/i.test(text);
}

async function attachWatchers(page) {
  page.on('console', (message) => {
    if (severeConsole(message)) {
      result.consoleErrors.push({
        url: page.url(),
        type: message.type(),
        text: message.text().slice(0, 600),
      });
    }
  });
  page.on('pageerror', (error) => {
    result.pageErrors.push({ url: page.url(), message: error.message.slice(0, 600) });
  });
  page.on('requestfailed', (request) => {
    const url = request.url();
    const type = request.resourceType();
    const failure = request.failure()?.errorText || '';
    if (failure === 'net::ERR_ABORTED') return;
    if (url.startsWith(BASE_URL) || type === 'document' || type === 'script' || type === 'fetch' || type === 'xhr') {
      result.failedRequests.push({
        url,
        method: request.method(),
        resourceType: type,
        failure,
      });
    }
  });
}

async function goto(page, path) {
  const response = await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
  return response;
}

async function visibleText(page, selector) {
  const locator = page.locator(selector).first();
  if (!(await locator.count())) return '';
  return (await locator.textContent())?.trim() || '';
}

async function checkNoOverflow(page, label) {
  const data = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  result.responsive.push({
    label,
    ...data,
    ok: data.scrollWidth <= data.clientWidth + 2 && data.bodyScrollWidth <= data.clientWidth + 2,
  });
}

async function routeSweep(page) {
  for (const route of routes) {
    const response = await goto(page, route);
    const bodyText = (await page.locator('body').innerText({ timeout: 10000 })).trim();
    result.routes.push({
      route,
      status: response?.status() ?? 0,
      title: await page.title(),
      bodyLength: bodyText.length,
      blank: bodyText.length < 80,
    });
  }
}

async function homeFlow(page) {
  await goto(page, '/');
  await page.locator('.hs-logo').click();
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.locator('.hs-search input').fill('tom');
  await page.locator('.hs-search-btn').click();
  await page.waitForURL(/\/products\?search=tom/);
  await page.locator('.hs-nav-link.active').first().waitFor({ timeout: 10000 }).catch(() => {});
  const searchTitle = await visibleText(page, '.hs-page-toolbar h1');

  await goto(page, '/');
  await page.locator('.hs-cat-card').filter({ hasText: 'Combo' }).first().click();
  await page.waitForURL(/category=combo/);
  const categoryTitle = await visibleText(page, '.hs-page-toolbar h1');

  await goto(page, '/');
  const firstProduct = page.locator('.hs-pcard').first();
  await firstProduct.locator('.hs-pcard-name').click();
  await page.waitForURL(/\/products\//);
  const detailTitle = await visibleText(page, '.detail-info h1');

  await goto(page, '/');
  await page.locator('.hs-pcard-cart').first().click();
  await page.locator('.hs-cart-icon i').waitFor({ timeout: 10000 });
  const cartBadge = await visibleText(page, '.hs-cart-icon i');
  const toastText = await visibleText(page, '[style*="position: fixed"]');

  result.flows.push({
    name: 'home',
    searchTitle,
    categoryTitle,
    detailTitle,
    cartBadge,
    toastText,
  });
}

async function productsFlow(page) {
  await goto(page, '/products');
  const initialCount = await page.locator('.hs-pcard').count();
  await goto(page, '/products?category=tom');
  const tomTitle = await visibleText(page, '.hs-page-toolbar h1');
  await goto(page, '/products?category=combo');
  const comboTitle = await visibleText(page, '.hs-page-toolbar h1');
  await goto(page, '/products?search=tom');
  const searchTitle = await visibleText(page, '.hs-page-toolbar h1');

  const sortChecks = [];
  for (const sort of ['best-selling', 'price-asc', 'price-desc', 'newest']) {
    await goto(page, `/products?sort=${sort}`);
    const selectValue = await page.locator('.hs-sort-select select').inputValue();
    const firstName = await visibleText(page, '.hs-pcard-name');
    sortChecks.push({ sort, selectValue, firstName });
  }

  await goto(page, '/products');
  await page.locator('.hs-pcard-cart').first().click();
  await page.locator('.hs-cart-icon i').waitFor({ timeout: 10000 });
  const cartBadge = await visibleText(page, '.hs-cart-icon i');
  await page.locator('.hs-pcard-name').first().click();
  await page.waitForURL(/\/products\//);

  result.flows.push({ name: 'products', initialCount, tomTitle, comboTitle, searchTitle, sortChecks, cartBadge });
}

async function detailFlow(page) {
  await goto(page, '/products/tom-su-size-l');
  const title = await visibleText(page, '.detail-info h1');
  const galleryImage = await page.locator('.detail-photo img').getAttribute('src');
  const tabsTopGap = await page.evaluate(() => {
    const grid = document.querySelector('.detail-grid')?.getBoundingClientRect();
    const tabs = document.querySelector('.pd-tabs-layout')?.getBoundingClientRect();
    return grid && tabs ? Math.round(tabs.top - grid.bottom) : null;
  });
  const qtyBefore = await visibleText(page, '.buy-card .qty span');
  await page.locator('.buy-card .qty button').last().click();
  const qtyAfter = await visibleText(page, '.buy-card .qty span');
  const variantCount = await page.locator('.size-grid button').count();
  if (variantCount > 1) await page.locator('.size-grid button').nth(1).click();
  const processingCount = await page.locator('.buy-card .chip-grid button').filter({ hasText: /Làm sạch|Cắt khúc|Để sống/ }).count();
  if (processingCount > 1) await page.locator('.buy-card .chip-grid button').filter({ hasText: /Làm sạch|Cắt khúc/ }).first().click();
  await page.locator('.cart-cta').click();
  await page.locator('.hs-cart-icon i').waitFor({ timeout: 10000 });
  const badgeAfterAdd = await visibleText(page, '.hs-cart-icon i');
  await page.locator('.buy-cta').click();
  await page.waitForURL(/\/checkout/, { timeout: 12000 });
  const checkoutTitle = await visibleText(page, '.hs-page-toolbar h1');

  result.flows.push({
    name: 'detail',
    title,
    galleryImage,
    tabsTopGap,
    qtyBefore,
    qtyAfter,
    variantCount,
    processingCount,
    badgeAfterAdd,
    checkoutTitle,
  });
}

async function cartCheckoutFlow(page) {
  await goto(page, '/cart');
  const itemName = await visibleText(page, '.cart-item-info h3');
  const totalBefore = await visibleText(page, '.summary .total b');
  await page.locator('.cart-item .qty button').last().click();
  const totalAfterPlus = await visibleText(page, '.summary .total b');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
  const itemAfterReload = await visibleText(page, '.cart-item-info h3');
  const totalAfterReload = await visibleText(page, '.summary .total b');
  const qtyAfterReload = await visibleText(page, '.cart-item .qty span');
  const minusDisabledAfterReload = await page.locator('.cart-item .qty button').first().isDisabled().catch(() => true);
  if (!minusDisabledAfterReload) {
    await page.locator('.cart-item .qty button').first().click();
  }
  const totalAfterMinus = await visibleText(page, '.summary .total b');

  await goto(page, '/checkout');
  await page.locator('button[type="submit"]').click();
  const validateMessage = await visibleText(page, '.submit-error, .checkout-error, .form-error, [class*="error"]');
  await page.locator('input[placeholder="Nguyễn Văn A"]').fill('Nguyen Van QA');
  await page.locator('input[placeholder="0901 234 567"]').fill('0901234567');
  await page.locator('input[placeholder*="Số nhà"]').fill('123 Duong Bien, Q1, TP.HCM');
  const orderResponses = [];
  page.on('response', (response) => {
    if (response.url().includes('/api/orders')) {
      orderResponses.push({ url: response.url(), status: response.status() });
    }
  });
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/order-success/, { timeout: 20000 });
  const successTitle = await visibleText(page, '.success-title');
  await goto(page, '/cart');
  const emptyCartText = await visibleText(page, '.empty-state h2');

  const emptyContext = await page.context().browser().newContext({ viewport: { width: 1366, height: 820 } });
  const emptyPage = await emptyContext.newPage();
  await attachWatchers(emptyPage);
  await goto(emptyPage, '/checkout');
  const emptyCheckoutText = await visibleText(emptyPage, '.empty-state h2');
  await emptyContext.close();

  result.flows.push({
    name: 'cart-checkout',
    itemName,
    itemAfterReload,
    totalBefore,
    totalAfterPlus,
    totalAfterReload,
    qtyAfterReload,
    minusDisabledAfterReload,
    totalAfterMinus,
    validateMessage,
    orderResponses,
    successTitle,
    emptyCartText,
    emptyCheckoutText,
  });
}

async function authFlow(page) {
  await goto(page, '/register');
  await page.waitForURL(/\/account\?mode=register/);
  const registerActive = await visibleText(page, '.auth-toggle-btn.active');
  await page.locator('input[placeholder="Nguyễn Văn A"]').fill('QA User');
  await page.locator('input[type="tel"]').fill(`090${Date.now().toString().slice(-7)}`);
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('.auth-submit').click();
  await page.waitForURL(/\/account/, { timeout: 15000 });
  await page.locator('.ac-profile-info b').waitFor({ timeout: 15000 });
  const accountTitle = await visibleText(page, '.hs-page-toolbar h1');
  const accountName = await visibleText(page, '.ac-profile-info b');
  await page.locator('.ac-logout').click();
  await page.locator('.auth-form-header h2').waitFor({ timeout: 10000 });
  await goto(page, '/login');
  await page.waitForURL(/\/account\?mode=login/);
  const loginActive = await visibleText(page, '.auth-toggle-btn.active');

  result.flows.push({ name: 'auth', registerActive, accountTitle, accountName, loginActive });
}

async function responsiveSweep(page) {
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const route of ['/', '/products', '/products/tom-su-size-l', '/cart', '/checkout']) {
      await goto(page, route);
      await checkNoOverflow(page, `${viewport.name} ${route}`);
    }
  }
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
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await attachWatchers(page);

  await routeSweep(page);
  await context.clearCookies();
  await page.evaluate(() => localStorage.clear()).catch(() => {});
  await homeFlow(page);
  await productsFlow(page);
  await detailFlow(page);
  await cartCheckoutFlow(page);
  await authFlow(page);
  await responsiveSweep(page);

  await browser.close();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
