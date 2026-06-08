const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const results = { write: {}, read: {} };
  let testCount = 0, passCount = 0;

  function check(name, ok) {
    testCount++;
    if (ok) passCount++;
    const icon = ok ? '  \u2705' : '  \u274C';
    console.log(icon, name);
    return ok;
  }

  const http = require('http');
  const apiPort = Number(process.env.API_PORT || 3001);
  function api(method, path, body, token) {
    return new Promise((resolve, reject) => {
      const opts = {
        hostname: 'localhost', port: apiPort,
        path: '/api' + path,
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (token) opts.headers['Authorization'] = 'Bearer ' + token;
      const req = http.request(opts, res => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
          catch { resolve({ status: res.statusCode, body: data }); }
        });
      });
      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  const login = await api('POST', '/auth/login', { phone: '0901234567', password: 'Admin@123' });
  const token = login.body.data?.token;
  check('Login token OK', !!token);

  // ===== PRODUCTS CRUD =====
  console.log('\n=== PRODUCTS CRUD ===');

  const list = await api('GET', '/products?limit=2', null, token);
  check('Products list 200', list.status === 200);

  const prodSlug = 'db-check-product-' + Date.now();
  const created = await api('POST', '/products', {
    name: 'DB_CHECK_PRODUCT', slug: prodSlug,
    categoryId: 'f008e140-8b98-401c-a2cd-1892c6931dd4',
    basePrice: 100000, unit: 'KG', status: 'ACTIVE',
    shortDescription: 'Test', description: 'Test',
    stockQuantity: 50, lowStockThreshold: 10,
  }, token);
  const prodId = created.body?.data?.id;
  check('Create product', (created.status === 200 || created.status === 201) && !!prodId);
  results.write.createProduct = (created.status === 200 || created.status === 201) && !!prodId;

  if (prodId) {
    const dbCheck = await prisma.product.findUnique({ where: { id: prodId }, include: { inventory: true } });
    check('DB verify product created', !!dbCheck);
    check('DB inventory record created', dbCheck?.inventory?.length > 0);
    check('DB stock quantity=50', String(dbCheck?.inventory?.[0]?.quantity) === '50');
    check('DB lowStockThreshold=10', String(dbCheck?.inventory?.[0]?.lowStockThreshold) === '10');

    const updated = await api('PUT', '/products/' + prodId, { basePrice: 150000, name: 'DB_CHECK_UPDATED' }, token);
    check('Update product 200', updated.status === 200);

    const dbCheck2 = await prisma.product.findUnique({ where: { id: prodId } });
    check('DB verify price=150000', String(dbCheck2?.basePrice) === '150000');
    check('DB verify name updated', dbCheck2?.name === 'DB_CHECK_UPDATED');

    const deleted = await api('DELETE', '/products/' + prodId, null, token);
    check('Delete product 200', deleted.status === 200 || deleted.status === 204);

    const dbCheck3 = await prisma.product.findUnique({ where: { id: prodId } });
    check('DB verify product deleted', !dbCheck3);
  }

  // ===== CATEGORIES CRUD =====
  console.log('\n=== CATEGORIES CRUD ===');

  const listCat = await api('GET', '/categories', null, token);
  check('Categories list 200', listCat.status === 200);

  const catSlug = 'db-check-cat-' + Date.now();
  const createdCat = await api('POST', '/categories', {
    name: 'DB_CHECK_CATEGORY', slug: catSlug, sortOrder: 99, isActive: true,
  }, token);
  const catId = createdCat.body?.data?.id;
  check('Create category', (createdCat.status === 200 || createdCat.status === 201) && !!catId);

  if (catId) {
    const catDb = await prisma.category.findUnique({ where: { id: catId } });
    check('DB verify category created', !!catDb);

    const updatedCat = await api('PUT', '/categories/' + catId, { name: 'DB_CHECK_CATEGORY_UPDATED' }, token);
    check('Update category 200', updatedCat.status === 200);

    const deletedCat = await api('DELETE', '/categories/' + catId, null, token);
    check('Delete category 200', deletedCat.status === 200);

    const catDb3 = await prisma.category.findUnique({ where: { id: catId } });
    check('DB verify category deleted', !catDb3);
  }

  // ===== STAFF CRUD =====
  console.log('\n=== STAFF CRUD ===');

  const listStaff = await api('GET', '/staff', null, token);
  check('Staff list 200', listStaff.status === 200);

  const ts = Date.now();
  const createdStaff = await api('POST', '/staff', {
    fullName: 'DB_CHECK_STAFF',
    phone: '0999' + ts.toString().slice(-7),
    email: 'dbcheck' + ts + '@test.com',
    role: 'STAFF', password: 'Test@123456',
  }, token);
  const staffId = createdStaff.body?.id;
  check('Create staff', createdStaff.status === 201 && !!staffId);

  if (staffId) {
    const staffDb = await prisma.profile.findUnique({ where: { id: staffId } });
    check('DB verify staff created', !!staffDb);

    const updatedStaff = await api('PUT', '/staff/' + staffId, { fullName: 'DB_CHECK_STAFF_UPDATED', status: 'BLOCKED' }, token);
    check('Update staff 200', updatedStaff.status === 200);

    const staffDb2 = await prisma.profile.findUnique({ where: { id: staffId } });
    check('DB verify staff status=BLOCKED', staffDb2?.status === 'BLOCKED');

    const deletedStaff = await api('DELETE', '/staff/' + staffId, null, token);
    check('Delete staff 200', deletedStaff.status === 200);

    const staffDb3 = await prisma.profile.findUnique({ where: { id: staffId } });
    check('DB verify staff deleted', !staffDb3);
  }

  // ===== BANNERS CRUD =====
  console.log('\n=== BANNERS CRUD ===');

  const listBan = await api('GET', '/banners', null, token);
  check('Banners list 200', listBan.status === 200);

  const createdBan = await api('POST', '/banners', {
    title: 'DB_CHECK_BANNER',
    imageUrl: 'https://via.placeholder.com/1200x400',
    linkUrl: 'https://example.com',
    position: 'HOME_HERO', sortOrder: 99, isActive: true,
  }, token);
  const banId = createdBan.body?.data?.id;
  check('Create banner 200/201', !!banId);

  if (banId) {
    const banDb = await prisma.banner.findUnique({ where: { id: banId } });
    check('DB verify banner created', !!banDb);

    const updatedBan = await api('PUT', '/banners/' + banId, { title: 'DB_CHECK_BANNER_UPDATED', isActive: false }, token);
    check('Update banner 200', updatedBan.status === 200);

    const deletedBan = await api('DELETE', '/banners/' + banId, null, token);
    check('Delete banner 200', deletedBan.status === 200);

    const banDb3 = await prisma.banner.findUnique({ where: { id: banId } });
    check('DB verify banner deleted', !banDb3);
  }

  // ===== PROMOTIONS CRUD =====
  console.log('\n=== PROMOTIONS CRUD ===');

  const listPromo = await api('GET', '/promotions', null, token);
  check('Promotions list 200', listPromo.status === 200);

  const createdPromo = await api('POST', '/promotions', {
    code: 'DB_CHECK_' + ts, name: 'DB_CHECK_PROMOTION',
    discountType: 'PERCENT', discountValue: 10,
    minOrderAmount: 100000,
    startAt: new Date().toISOString(),
    endAt: new Date(Date.now() + 86400000).toISOString(),
    isActive: true,
  }, token);
  const promoId = createdPromo.body?.data?.id;
  check('Create promotion', (createdPromo.status === 200 || createdPromo.status === 201) && !!promoId);

  if (promoId) {
    const promoDb = await prisma.promotion.findUnique({ where: { id: promoId } });
    check('DB verify promotion created', !!promoDb);

    const updatedPromo = await api('PUT', '/promotions/' + promoId, { discountValue: 20 }, token);
    check('Update promotion 200', updatedPromo.status === 200);

    const promoDb2 = await prisma.promotion.findUnique({ where: { id: promoId } });
    check('DB verify discountValue=20', String(promoDb2?.discountValue) === '20');

    const deletedPromo = await api('DELETE', '/promotions/' + promoId, null, token);
    check('Delete promotion 200', deletedPromo.status === 200);

    const promoDb3 = await prisma.promotion.findUnique({ where: { id: promoId } });
    check('DB verify promotion deleted', !promoDb3);
  }

  // ===== ORDERS UPDATE =====
  console.log('\n=== ORDERS UPDATE ===');

  const listOrders = await api('GET', '/orders?limit=1', null, token);
  check('Orders list 200', listOrders.status === 200);

  if (listOrders.body?.data?.[0]) {
    const orderId = listOrders.body.data[0].id;
    const originalStatus = listOrders.body.data[0].orderStatus;

    const updatedOrder = await api('PUT', '/orders/' + orderId + '/status', { status: 'CONFIRMED' }, token);
    check('Update order status 200', updatedOrder.status === 200);

    const orderDb = await prisma.order.findUnique({ where: { id: orderId } });
    check('DB verify order CONFIRMED', orderDb?.orderStatus === 'CONFIRMED');

    const reverted = await api('PUT', '/orders/' + orderId + '/status', { status: originalStatus || 'NEW' }, token);
    check('Revert order status 200', reverted.status === 200);
  }

  // ===== ORDER STATUS HISTORY =====
  console.log('\n=== ORDER STATUS HISTORY ===');

  const existingOrder = await api('GET', '/orders?limit=1', null, token);
  if (existingOrder.body?.data?.[0]) {
    const orderId = existingOrder.body.data[0].id;
    const originalStatus = existingOrder.body.data[0].orderStatus;
    const oldCount = await prisma.orderStatusHistory.count({ where: { orderId } });

    await api('PUT', '/orders/' + orderId + '/status', { status: 'CONFIRMED' }, token);

    const totalAfter = await prisma.orderStatusHistory.count({ where: { orderId } });
    check('Order status history created', totalAfter > oldCount);

    const latest = await prisma.orderStatusHistory.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
    if (latest) {
      check('History orderId matches', latest.orderId === orderId);
      check('History newStatus=CONFIRMED', latest.status === 'CONFIRMED');
      check('History createdAt exists', !!latest.createdAt);
    }

    // Revert
    await api('PUT', '/orders/' + orderId + '/status', { status: originalStatus || 'NEW' }, token);
  } else {
    check('Order status history: skip (no orders)', true);
  }

  // ===== INVENTORY LOGS =====
  console.log('\n=== INVENTORY LOGS ===');

  const prodForAdjust = await prisma.product.findFirst({
    where: { status: 'ACTIVE', inventory: { some: {} } },
    include: { inventory: true },
  });

  if (prodForAdjust && prodForAdjust.inventory.length > 0) {
    const inv = prodForAdjust.inventory[0];
    const oldQty = Number(inv.quantity);
    const newQty = oldQty + 5;
    const oldLogCount = await prisma.inventoryLog.count({ where: { productId: prodForAdjust.id } });

    const adjustRes = await api('POST', '/inventory/adjust', {
      productId: prodForAdjust.id,
      newQuantity: newQty,
      note: 'DB_CHECK_ADJUST',
    }, token);
    check('Adjust stock 200/201', adjustRes.status === 200 || adjustRes.status === 201);

    const invDb = await prisma.inventory.findUnique({ where: { id: inv.id } });
    check('DB inventory quantity changed', Number(invDb?.quantity) === newQty);

    const totalLogsAfter = await prisma.inventoryLog.count({ where: { productId: prodForAdjust.id } });
    check('Inventory log created', totalLogsAfter > oldLogCount);

    const latestLog = await prisma.inventoryLog.findFirst({
      where: { productId: prodForAdjust.id },
      orderBy: { createdAt: 'desc' },
    });
    if (latestLog) {
      check('Log productId matches', latestLog.productId === prodForAdjust.id);
      check('Log type=ADJUSTMENT', latestLog.type === 'ADJUSTMENT');
      check('Log oldQuantity matches', Number(latestLog.oldQuantity) === oldQty);
      check('Log newQuantity matches', Number(latestLog.newQuantity) === newQty);
      check('Log note=DB_CHECK_ADJUST', latestLog.note === 'DB_CHECK_ADJUST');
      check('Log createdAt exists', !!latestLog.createdAt);
    }

    // Restore
    await api('POST', '/inventory/adjust', {
      productId: prodForAdjust.id,
      newQuantity: oldQty,
      note: 'DB_CHECK_RESTORE',
    }, token);
  } else {
    check('Inventory logs: skip (no products)', true);
  }

  // ===== NOTIFICATIONS CRUD =====
  console.log('\n=== NOTIFICATIONS CRUD ===');

  const notif = await prisma.notification.create({
    data: {
      title: 'DB_CHECK_NOTIFICATION',
      message: 'Test notification created via db check',
      type: 'SYSTEM',
      userId: null,
      data: { test: true },
    },
  });
  check('Create notification via Prisma', !!notif.id);

  const notifDb = await prisma.notification.findUnique({ where: { id: notif.id } });
  check('DB verify notification title', notifDb?.title === 'DB_CHECK_NOTIFICATION');
  check('DB verify notification type=SYSTEM', notifDb?.type === 'SYSTEM');
  check('DB verify notification userId=null', notifDb?.userId === null);
  check('DB verify notification isRead=false', notifDb?.isRead === false);
  check('DB verify notification data', notifDb?.data?.test === true);
  check('DB verify notification createdAt exists', !!notifDb?.createdAt);

  const updated = await prisma.notification.update({
    where: { id: notif.id },
    data: { isRead: true },
  });
  check('Mark notification read', updated.isRead === true);

  const notifDb2 = await prisma.notification.findUnique({ where: { id: notif.id } });
  check('DB verify isRead=true', notifDb2?.isRead === true);

  // Cleanup
  await prisma.notification.delete({ where: { id: notif.id } });
  const notifDb3 = await prisma.notification.findUnique({ where: { id: notif.id } });
  check('DB verify notification deleted', !notifDb3);

  // ===== SUMMARY =====
  console.log('\n============ CRUD TEST SUMMARY ============');
  console.log(`\n\uD83D\uDCCA ${passCount}/${testCount} tests passed`);

  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); prisma.$disconnect(); });
