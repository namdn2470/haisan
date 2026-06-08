/**
 * Checkout E2E Test Script
 * Tests the full customer checkout flow: add to cart → checkout → order → notification
 *
 * Run: node packages/db/scripts/test-checkout-flow.cjs
 * Requires: API running on port 3001
 */

const http = require('http');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const API_PORT = Number(process.env.API_PORT || 3001);
const PREFIX = 'DB_CHECK_';

const created = {
  orderIds: [],
  notificationIds: [],
  productIds: [],
  categoryIds: [],
};

let total = 0;
let passed = 0;

function check(name, condition, proof) {
  total += 1;
  if (condition) passed += 1;
  console.log(`  ${condition ? 'PASS' : 'FAIL'} ${name}${proof ? ` :: ${proof}` : ''}`);
}

function api(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const hasBody = body !== undefined && body !== null;
    const payload = hasBody ? JSON.stringify(body) : undefined;
    const req = http.request({
      hostname: 'localhost',
      port: API_PORT,
      path: `/api${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        let parsed = raw;
        try { parsed = raw ? JSON.parse(raw) : {}; } catch { /* ignore */ }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function waitForApi(maxAttempts = 15) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${API_PORT}/api/products`, r => resolve(r));
        req.on('error', reject);
        req.setTimeout(1000, () => { req.destroy(); reject(new Error('timeout')); });
      });
      if (res.statusCode) return true;
    } catch { /* retry */ }
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error(`API not ready after ${maxAttempts}s`);
}

async function cleanup() {
  // Cleanup orders and related data
  const staleOrders = await prisma.order.findMany({
    where: { customerName: { startsWith: PREFIX } },
    select: { id: true },
  });
  const staleOrderIds = staleOrders.map(o => o.id);
  if (staleOrderIds.length) {
    await prisma.orderCoupon.deleteMany({ where: { orderId: { in: staleOrderIds } } });
    await prisma.orderStatusHistory.deleteMany({ where: { orderId: { in: staleOrderIds } } });
    await prisma.orderItem.deleteMany({ where: { orderId: { in: staleOrderIds } } });
    await prisma.payment.deleteMany({ where: { orderId: { in: staleOrderIds } } });
    await prisma.delivery.deleteMany({ where: { orderId: { in: staleOrderIds } } });
    await prisma.notification.deleteMany({
      where: { message: { contains: PREFIX } },
    });
    await prisma.order.deleteMany({ where: { id: { in: staleOrderIds } } });
  }
  // Cleanup test products
  await prisma.productImage.deleteMany({ where: { productId: { in: created.productIds } } });
  await prisma.inventory.deleteMany({ where: { productId: { in: created.productIds } } });
  await prisma.product.deleteMany({ where: { id: { in: created.productIds } } });
  await prisma.category.deleteMany({ where: { id: { in: created.categoryIds } } });
}

async function main() {
  console.log('\n=== CHECKOUT E2E FLOW TEST ===\n');
  await waitForApi();
  await cleanup();

  // Step 1: Admin login
  console.log('[1] Admin login...');
  const adminLogin = await api('POST', '/auth/login', {
    phone: '0901234567',
    password: 'Admin@123',
  });
  const adminToken = adminLogin.body?.data?.token;
  check('admin login returns token', !!adminToken);

  // Step 2: Create test category
  console.log('[2] Create test category...');
  const ts = Date.now();
  const catSlug = `db-check-checkout-cat-${ts}`;
  const catCreate = await api('POST', '/categories', {
    name: `${PREFIX}CATEGORY`,
    slug: catSlug,
    isActive: true,
  }, adminToken);
  const catId = catCreate.body?.data?.id;
  if (catId) created.categoryIds.push(catId);
  check('category created', catCreate.status === 201 && !!catId);

  // Step 3: Create test product (active, in-stock)
  console.log('[3] Create test product...');
  const prodSlug = `db-check-checkout-prod-${ts}`;
  const prodCreate = await api('POST', '/products', {
    name: `${PREFIX}PRODUCT`,
    slug: prodSlug,
    categoryId: catId,
    basePrice: 150000,
    isActive: true,
    stockQuantity: 100,
    unit: 'KG',
  }, adminToken);
  const prodId = prodCreate.body?.data?.id;
  if (prodId) created.productIds.push(prodId);
  check('product created', prodCreate.status === 201 && !!prodId);

  // Step 4: Create test promotion (active coupon)
  console.log('[4] Create test coupon...');
  const promoCode = `TESTCHECK${ts.toString().slice(-4)}`;
  const promoCreate = await api('POST', '/promotions', {
    name: `${PREFIX}COUPON`,
    code: promoCode,
    discountType: 'PERCENT',
    discountValue: 10,
    minOrderAmount: 50000,
    maxDiscountAmount: 50000,
    isActive: true,
    startAt: new Date(Date.now() - 86400000).toISOString(),
    endAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    usageLimit: 100,
  }, adminToken);
  const promoId = promoCreate.body?.data?.id;
  check('promotion created', promoCreate.status === 201 && !!promoId);

  // Step 5: Verify promotion is queryable
  console.log('[5] Verify promotion API...');
  const promoFetch = await api('GET', `/promotions/code/${promoCode}`);
  check('promotion fetchable by code', promoFetch.status === 200);

  // Step 6: Place order as anonymous user (guest checkout)
  console.log('[6] Guest checkout (no auth token)...');
  const orderPayload = {
    customer_name: `${PREFIX}GUEST`,
    customer_phone: '0909999000',
    customer_email: 'guest@test.com',
    shipping_address_text: `${PREFIX}123 Test Street, District 1, Ho Chi Minh City`,
    delivery_slot: '08:00-10:00',
    payment_method: 'COD',
    shipping_fee: 30000,
    coupon_code: promoCode,
    discount_amount: 15000, // 10% of 150000
    note: `${PREFIX}TEST_ORDER`,
    items: [
      {
        product_id: prodId,
        product_name: `${PREFIX}PRODUCT`,
        quantity: 1,
        price_at_time: 150000,
        unit: 'KG',
      },
    ],
    discount_amount: 15000, // backend recalculates, but we pass it anyway
    total_amount: 165000,   // for reference, backend recalculates from items
  };
  const orderCreate = await api('POST', '/orders', orderPayload);
  const orderId = orderCreate.body?.data?.id;
  const orderCode = orderCreate.body?.data?.orderCode;
  if (orderId) created.orderIds.push(orderId);
  check('order created', orderCreate.status === 201 && !!orderId, `id=${orderId}`);
  check('order has orderCode', !!orderCode);
  check('orderCode format ORD-', orderCode?.startsWith('ORD-'));

  // Step 7: Verify DB - order exists
  console.log('[7] Verify DB - order record...');
  if (orderId) {
    const dbOrder = await prisma.order.findUnique({ where: { id: orderId } });
    check('order in DB', !!dbOrder);
    check('order customerName matches', dbOrder?.customerName === `${PREFIX}GUEST`);
    check('order shipping_fee set', dbOrder?.shippingFee != null && Number(dbOrder?.shippingFee) >= 0);
    check('order paymentMethod = COD', dbOrder?.paymentMethod === 'COD');
    check('order orderStatus = NEW', dbOrder?.orderStatus === 'NEW');
    check('order discountAmount > 0', (dbOrder?.discountAmount ?? 0) > 0);
    console.log(`    DB: shippingFee=${dbOrder?.shippingFee}, discountAmount=${dbOrder?.discountAmount}, totalAmount=${dbOrder?.totalAmount}`);
  }

  // Step 8: Verify DB - order items
  console.log('[8] Verify DB - order items...');
  if (orderId) {
    const items = await prisma.orderItem.findMany({ where: { orderId } });
    check('order has items', items.length === 1);
    if (items.length > 0) {
      check('item productName matches', items[0].productName === `${PREFIX}PRODUCT`);
      check('item quantity > 0', items[0].quantity > 0);
      check('item price > 0', items[0].price > 0);
      console.log(`    DB: item qty=${items[0].quantity}, price=${items[0].price}, totalPrice=${items[0].totalPrice}`);
    }
  }

  // Step 9: Verify DB - order_coupons (coupon was applied)
  console.log('[9] Verify DB - order_coupons...');
  if (orderId) {
    const orderCoupons = await prisma.orderCoupon.findMany({ where: { orderId } });
    console.log(`    DB: order_coupons count=${orderCoupons.length}`);
    check('order_coupons record exists', orderCoupons.length === 1);
    if (orderCoupons.length > 0) {
      check('order_coupon discountAmount > 0', orderCoupons[0].discountAmount > 0);
      check('order_coupon promotionId set', !!orderCoupons[0].promotionId);
      console.log(`    DB: order_coupon discountAmount=${orderCoupons[0].discountAmount}`);
    } else {
      // Debug: check if promotionId was set in the order
      const dbOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: { coupons: true },
      });
      console.log(`    DB DEBUG: order.discountAmount=${dbOrder?.discountAmount}, coupons=${JSON.stringify(dbOrder?.coupons)}`);
    }
  }

  // Step 10: Verify DB - order_status_history (initial status)
  console.log('[10] Verify DB - order_status_history...');
  if (orderId) {
    const history = await prisma.orderStatusHistory.findMany({ where: { orderId } });
    check('order_status_history has record', history.length >= 1);
    check('initial status = NEW', history[0]?.status === 'NEW');
  }

  // Step 11: Verify DB - notification created
  console.log('[11] Verify DB - notification...');
  if (orderId) {
    // Notification message contains orderCode like "ORD-...", not customerName
    const notifications = await prisma.notification.findMany({
      where: {
        message: { contains: 'ORD-' },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    check('notifications exist in DB', notifications.length > 0);
    const orderNotification = notifications.find(n =>
      n.message?.includes(orderCode || orderId?.slice(0, 8))
    );
    check('notification references order', !!orderNotification);
    created.notificationIds.push(...notifications.map(n => n.id));
    if (notifications.length > 0) {
      console.log(`    DB: latest notification type=${notifications[0].type}, message="${notifications[0].message}"`);
    }
  }

  // Step 12: Verify shipping quote API
  console.log('[12] Verify shipping quote API...');
  const shippingQuote = await api('GET', `/shipping-zones/quote?province=Ho+Chi+Minh&district=Quan+1&subtotal=150000`);
  check('shipping quote returns 200', shippingQuote.status === 200);
  if (shippingQuote.body?.data) {
    check('shipping quote has shippingFee', typeof shippingQuote.body.data.shippingFee === 'number');
  }

  // Step 13: Test expired/invalid coupon rejection
  console.log('[13] Test coupon validation...');
  const expiredPayload = {
    customer_name: `${PREFIX}TEST2`,
    customer_phone: '0909999001',
    shipping_address_text: 'Test Address',
    payment_method: 'COD',
    shipping_fee: 30000,
    coupon_code: 'EXPIRED999',
    items: [{ product_id: prodId, product_name: 'Test', quantity: 1, price_at_time: 100000, unit: 'KG' }],
  };
  const expiredOrder = await api('POST', '/orders', expiredPayload);
  check('invalid coupon rejected', expiredOrder.status === 400);

  // Step 14: Admin can see all orders
  console.log('[14] Admin order list...');
  const adminOrders = await api('GET', '/orders', null, adminToken);
  console.log(`    DEBUG: status=${adminOrders.status}, body keys=${Object.keys(adminOrders.body || {})}`);
  check('admin can list orders', adminOrders.status === 200);
  // The API may return { data, total } or just an array
  const orderData = adminOrders.body?.data || adminOrders.body;
  console.log(`    DEBUG: orderData type=${Array.isArray(orderData) ? 'array' : typeof orderData}, len=${Array.isArray(orderData) ? orderData.length : 'N/A'}`);
  check('admin order list has data', Array.isArray(orderData) && orderData.length > 0);
  const newOrder = Array.isArray(orderData) ? orderData.find((o) => o.id === orderId) : null;
  check('admin sees checkout order', !!newOrder);

  // Step 15: Admin update order status
  console.log('[15] Admin update order status...');
  if (orderId) {
    const statusUpdate = await api('PUT', `/orders/${orderId}/status`, {
      status: 'CONFIRMED',
      note: `${PREFIX}CONFIRMED`,
      actorName: 'Admin Test',
    }, adminToken);
    check('order status updated', statusUpdate.status === 200);
    const updated = await prisma.order.findUnique({ where: { id: orderId } });
    check('order status = CONFIRMED in DB', updated?.orderStatus === 'CONFIRMED');
  }

  // Cleanup
  await cleanup();

  console.log(`\n========================================`);
  console.log(`  CHECKOUT FLOW: ${passed}/${total} checks passed`);
  console.log(`========================================\n`);
  if (passed < total) process.exitCode = 1;
}

main()
  .catch(async (err) => {
    console.error(err?.stack || err);
    try { await cleanup(); } catch {}
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
