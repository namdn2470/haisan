const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const results = {};

  results.categories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true, isActive: true, sortOrder: true,
      _count: { select: { products: true } } },
    orderBy: { sortOrder: 'asc' }
  });

  results.productCount = await prisma.product.count();
  results.products = await prisma.product.findMany({
    select: { id: true, name: true, status: true, categoryId: true, basePrice: true },
    take: 3
  });

  results.orders = await prisma.order.findMany({
    select: { id: true, orderCode: true, orderStatus: true, paymentStatus: true,
      totalAmount: true, customerName: true },
    orderBy: { createdAt: 'desc' }, take: 5
  });

  results.profiles = await prisma.profile.findMany({
    select: { id: true, fullName: true, phone: true, role: true, status: true }
  });

  results.promotions = await prisma.promotion.findMany({
    select: { id: true, code: true, name: true, discountType: true, discountValue: true, isActive: true }
  });

  results.banners = await prisma.banner.findMany({
    select: { id: true, title: true, position: true, isActive: true }
  });

  results.storeSettings = await prisma.storeSettings.findFirst();
  results.customRoles = await prisma.customRole.findMany({
    select: { id: true, name: true, slug: true, permissions: true, isActive: true }
  });
  results.deliveries = await prisma.delivery.findMany({ take: 3 });
  results.inventoryCount = await prisma.inventory.count();

  const emptyChecks = ['addresses','audit_logs','favorites','inventory_logs',
    'notifications','order_coupons','order_status_history','posts','reviews',
    'shipping_zones','site_configs'];
  for (const t of emptyChecks) {
    const [row] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as cnt FROM "${t}"`);
    results[t + 'Count'] = row.cnt;
  }

  console.log(JSON.stringify(results, null, 2));
  await prisma.$disconnect();
}
main().catch(e => { console.error(e.message); prisma.$disconnect(); });
