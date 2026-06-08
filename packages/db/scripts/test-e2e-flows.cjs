const http = require('http');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const API_PORT = Number(process.env.API_PORT || 3001);
const PREFIX = 'DB_CHECK_';

// Wait for API to be ready
async function waitForApi(maxAttempts = 15, intervalMs = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${API_PORT}/api/products`, (r) => resolve(r));
        req.on('error', reject);
        req.setTimeout(1000, () => { req.destroy(); reject(new Error('timeout')); });
      });
      if (res.statusCode) return true;
    } catch {}
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error(`API not available on port ${API_PORT} after ${maxAttempts}s`);
}

const created = {
  categoryIds: [],
  productIds: [],
  orderIds: [],
  notificationIds: [],
  postIds: [],
  reviewIds: [],
};

let total = 0;
let passed = 0;

function check(name, condition, proof) {
  total += 1;
  if (condition) passed += 1;
  console.log(`${condition ? 'PASS' : 'FAIL'} ${name}${proof ? ` :: ${proof}` : ''}`);
  if (!condition) throw new Error(name);
}

function api(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? undefined : JSON.stringify(body);
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
        try { parsed = raw ? JSON.parse(raw) : {}; } catch {}
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function cleanup() {
  await prisma.review.deleteMany({ where: { id: { in: created.reviewIds } } });
  await prisma.review.deleteMany({ where: { comment: { startsWith: PREFIX } } });

  await prisma.orderStatusHistory.deleteMany({ where: { orderId: { in: created.orderIds } } });
  await prisma.orderItem.deleteMany({ where: { orderId: { in: created.orderIds } } });
  await prisma.payment.deleteMany({ where: { orderId: { in: created.orderIds } } });
  await prisma.delivery.deleteMany({ where: { orderId: { in: created.orderIds } } });
  await prisma.order.deleteMany({ where: { id: { in: created.orderIds } } });
  const staleOrders = await prisma.order.findMany({
    where: { customerName: { startsWith: PREFIX } },
    select: { id: true },
  });
  const staleOrderIds = staleOrders.map((order) => order.id);
  if (staleOrderIds.length) {
    await prisma.orderStatusHistory.deleteMany({ where: { orderId: { in: staleOrderIds } } });
    await prisma.orderItem.deleteMany({ where: { orderId: { in: staleOrderIds } } });
    await prisma.payment.deleteMany({ where: { orderId: { in: staleOrderIds } } });
    await prisma.delivery.deleteMany({ where: { orderId: { in: staleOrderIds } } });
    await prisma.order.deleteMany({ where: { id: { in: staleOrderIds } } });
  }

  await prisma.notification.deleteMany({ where: { id: { in: created.notificationIds } } });
  await prisma.notification.deleteMany({ where: { title: { startsWith: PREFIX } } });
  await prisma.notification.deleteMany({ where: { message: { contains: PREFIX } } });

  await prisma.inventoryLog.deleteMany({ where: { note: { startsWith: PREFIX } } });

  await prisma.post.deleteMany({ where: { id: { in: created.postIds } } });
  await prisma.post.deleteMany({ where: { slug: { startsWith: 'db-check-' } } });

  await prisma.productImage.deleteMany({ where: { productId: { in: created.productIds } } });
  await prisma.inventory.deleteMany({ where: { productId: { in: created.productIds } } });
  await prisma.product.deleteMany({ where: { id: { in: created.productIds } } });
  await prisma.product.deleteMany({ where: { slug: { startsWith: 'db-check-' } } });

  await prisma.category.deleteMany({ where: { id: { in: created.categoryIds } } });
  await prisma.category.deleteMany({ where: { slug: { startsWith: 'db-check-' } } });
}

async function main() {
  await waitForApi();
  await cleanup();

  const login = await api('POST', '/auth/login', {
    phone: '0901234567',
    password: 'Admin@123',
  });
  const token = login.body?.data?.token;
  check('admin login returns token', (login.status === 200 || login.status === 201) && !!token);

  const ts = Date.now();

  const categorySlug = `db-check-category-${ts}`;
  const categoryCreate = await api('POST', '/categories', {
    name: `${PREFIX}CATEGORY`,
    slug: categorySlug,
    isActive: true,
  }, token);
  const categoryId = categoryCreate.body?.data?.id;
  if (categoryId) created.categoryIds.push(categoryId);
  check('category create API + DB', categoryCreate.status === 201 && !!categoryId);

  const categoryUpdate = await api('PUT', `/categories/${categoryId}`, {
    name: `${PREFIX}CATEGORY_UPDATED`,
    isActive: false,
  }, token);
  const categoryDb = await prisma.category.findUnique({ where: { id: categoryId } });
  check('category update persists after reload', categoryUpdate.status === 200 && categoryDb?.isActive === false);

  const productSlug = `db-check-product-${ts}`;
  const productCreate = await api('POST', '/products', {
    name: `${PREFIX}PRODUCT`,
    slug: productSlug,
    categoryId,
    basePrice: 123000,
    unit: 'KG',
    status: 'ACTIVE',
    stockQuantity: 12,
    lowStockThreshold: 5,
  }, token);
  const productId = productCreate.body?.data?.id;
  if (productId) created.productIds.push(productId);
  check('product create API + DB', productCreate.status === 201 && !!productId);

  const productUpdate = await api('PUT', `/products/${productId}`, {
    basePrice: 125000,
    stockQuantity: 14,
  }, token);
  const productDb = await prisma.product.findUnique({
    where: { id: productId },
    include: { inventory: true },
  });
  check('product update persists after reload', productUpdate.status === 200 && String(productDb?.basePrice) === '125000');
  check('inventory created with product', Number(productDb?.inventory?.[0]?.quantity || 0) === 14);

  const orderCreate = await api('POST', '/orders', {
    customer_name: `${PREFIX}ORDER_CUSTOMER`,
    customer_phone: '0900000000',
    shipping_address_text: `${PREFIX} shipping address`,
    payment_method: 'COD',
    shipping_fee: 0,
    items: [{
      product_id: productId,
      quantity: 2,
      selected_unit: 'KG',
      price_at_time: 125000,
      product_name: `${PREFIX}PRODUCT`,
    }],
  }, token);
  const orderId = orderCreate.body?.data?.id;
  if (orderId) created.orderIds.push(orderId);
  check('order create writes orders + items', orderCreate.status === 201 && !!orderId);

  const orderDb = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  check('order_items persisted', orderDb?.items?.length === 1, `order=${orderDb?.orderCode}`);

  const historyBefore = await prisma.orderStatusHistory.count({ where: { orderId } });
  const statusUpdate = await api('PUT', `/orders/${orderId}/status`, {
    status: 'CONFIRMED',
    note: `${PREFIX}STATUS`,
  }, token);
  const historyAfter = await prisma.orderStatusHistory.count({ where: { orderId } });
  check('order status update + history', statusUpdate.status === 200 && historyAfter > historyBefore);

  const inv = await prisma.inventory.findFirst({ where: { productId } });
  const oldQty = Number(inv?.quantity || 0);
  const adjust = await api('POST', '/inventory/adjust', {
    productId,
    newQuantity: oldQty + 3,
    note: `${PREFIX}ADJUST`,
  }, token);
  const invAfter = await prisma.inventory.findUnique({ where: { id: inv.id } });
  const log = await prisma.inventoryLog.findFirst({
    where: { productId, note: `${PREFIX}ADJUST` },
    orderBy: { createdAt: 'desc' },
  });
  check('inventory adjust writes DB + log', adjust.status === 201 && Number(invAfter?.quantity) === oldQty + 3 && !!log);
  await api('POST', '/inventory/adjust', {
    productId,
    newQuantity: oldQty,
    note: `${PREFIX}RESTORE`,
  }, token);

  const notificationCreate = await api('POST', '/notifications', {
    title: `${PREFIX}NOTIFICATION`,
    message: `${PREFIX} notification`,
    type: 'SYSTEM',
    data: { test: true },
  }, token);
  const notificationId = notificationCreate.body?.data?.id;
  if (notificationId) created.notificationIds.push(notificationId);
  check('notification create writes DB', notificationCreate.status === 201 && !!notificationId);

  const notificationRead = await api('PUT', `/notifications/${notificationId}/read`, undefined, token);
  const notificationDb = await prisma.notification.findUnique({ where: { id: notificationId } });
  check('notification read persists', notificationRead.status === 200 && notificationDb?.isRead === true);

  const postSlug = `db-check-post-${ts}`;
  const postCreate = await api('POST', '/posts', {
    title: `${PREFIX}POST`,
    slug: postSlug,
    excerpt: `${PREFIX} excerpt`,
    content: `${PREFIX} content`,
    status: 'DRAFT',
  }, token);
  const postId = postCreate.body?.data?.id;
  if (postId) created.postIds.push(postId);
  check('post draft create writes DB', postCreate.status === 201 && !!postId);

  const publicDraft = await api('GET', `/posts/slug/${postSlug}`);
  check('draft post is hidden public', publicDraft.status === 404);

  const postPublish = await api('PUT', `/posts/${postId}`, { status: 'PUBLISHED' }, token);
  const publicPublished = await api('GET', `/posts/slug/${postSlug}`);
  check('published post is public', postPublish.status === 200 && publicPublished.status === 200);

  const postHide = await api('PUT', `/posts/${postId}`, { status: 'HIDDEN' }, token);
  const publicHidden = await api('GET', `/posts/slug/${postSlug}`);
  check('hidden post is hidden public', postHide.status === 200 && publicHidden.status === 404);

  const reviewCreate = await api('POST', '/reviews', {
    productId,
    rating: 5,
    comment: `${PREFIX}REVIEW`,
    status: 'PENDING',
  }, token);
  const reviewId = reviewCreate.body?.data?.id;
  if (reviewId) created.reviewIds.push(reviewId);
  check('review create writes pending DB', reviewCreate.status === 201 && !!reviewId);

  const reviewApprove = await api('PUT', `/reviews/${reviewId}/status`, { status: 'APPROVED' }, token);
  const publicReviews = await api('GET', `/reviews?productId=${productId}`);
  check('approved review appears public', reviewApprove.status === 200 && publicReviews.body?.data?.some((r) => r.id === reviewId));

  const reviewHide = await api('PUT', `/reviews/${reviewId}/status`, { status: 'REJECTED' }, token);
  const publicReviewsAfterHide = await api('GET', `/reviews?productId=${productId}`);
  check('hidden review disappears public', reviewHide.status === 200 && !publicReviewsAfterHide.body?.data?.some((r) => r.id === reviewId));

  await cleanup();
  console.log(`SUMMARY ${passed}/${total} checks passed`);
}

main()
  .catch(async (error) => {
    console.error(error?.stack || error);
    try { await cleanup(); } catch (cleanupError) { console.error(cleanupError); }
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
