import { Injectable } from '@nestjs/common';
import { PrismaService } from '@hsbx/db';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private getDateRange(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  async getSummaryReport(startDate?: string, endDate?: string) {
    const { start, end } = this.getDateRange(startDate, endDate);

    // Total orders
    const totalOrders = await this.prisma.order.count({
      where: {
        createdAt: { gte: start, lte: end },
      },
    });

    // Completed orders
    const completedOrders = await this.prisma.order.count({
      where: {
        createdAt: { gte: start, lte: end },
        orderStatus: 'COMPLETED',
      },
    });

    // Cancelled orders
    const cancelledOrders = await this.prisma.order.count({
      where: {
        createdAt: { gte: start, lte: end },
        orderStatus: 'CANCELLED',
      },
    });

    // Total revenue (completed orders only)
    const revenueResult = await this.prisma.order.aggregate({
      where: {
        createdAt: { gte: start, lte: end },
        orderStatus: 'COMPLETED',
        paymentStatus: 'PAID',
      },
      _sum: { totalAmount: true },
    });

    const totalRevenue = Number(revenueResult._sum.totalAmount || 0);

    // Average order value
    const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

    // Cancellation rate
    const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

    // New customers
    const newCustomers = await this.prisma.profile.count({
      where: {
        createdAt: { gte: start, lte: end },
        role: 'CUSTOMER',
      },
    });

    // Orders by status
    const ordersByStatus = await this.prisma.order.groupBy({
      by: ['orderStatus'],
      where: {
        createdAt: { gte: start, lte: end },
      },
      _count: true,
    });

    return {
      totalOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
      averageOrderValue,
      cancellationRate: Math.round(cancellationRate * 100) / 100,
      newCustomers,
      ordersByStatus: ordersByStatus.map((s) => ({
        status: s.orderStatus,
        count: s._count,
      })),
    };
  }

  async getRevenueReport(startDate?: string, endDate?: string) {
    const { start, end } = this.getDateRange(startDate, endDate);

    // Get completed, paid orders
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        orderStatus: 'COMPLETED',
        paymentStatus: 'PAID',
      },
      select: {
        totalAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day
    const dailyRevenue: Record<string, number> = {};
    orders.forEach((order) => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + Number(order.totalAmount);
    });

    // Group by month
    const monthlyRevenue: Record<string, number> = {};
    orders.forEach((order) => {
      const monthKey = order.createdAt.toISOString().slice(0, 7); // YYYY-MM
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + Number(order.totalAmount);
    });

    // Calculate totals
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const averageDaily = Object.keys(dailyRevenue).length > 0
      ? totalRevenue / Object.keys(dailyRevenue).length
      : 0;
    const maxDaily = Object.values(dailyRevenue).reduce((max, v) => Math.max(max, v), 0);

    return {
      dailyRevenue: Object.entries(dailyRevenue).map(([date, amount]) => ({
        date,
        amount,
      })),
      monthlyRevenue: Object.entries(monthlyRevenue).map(([month, amount]) => ({
        month,
        amount,
      })),
      totalRevenue,
      averageDaily,
      maxDaily,
      orderCount: orders.length,
    };
  }

  async getOrdersReport(startDate?: string, endDate?: string) {
    const { start, end } = this.getDateRange(startDate, endDate);

    // Orders by status
    const ordersByStatus = await this.prisma.order.groupBy({
      by: ['orderStatus'],
      where: {
        createdAt: { gte: start, lte: end },
      },
      _count: true,
    });

    // Orders by payment method
    const ordersByPayment = await this.prisma.order.groupBy({
      by: ['paymentMethod'],
      where: {
        createdAt: { gte: start, lte: end },
      },
      _count: true,
    });

    // Orders by source
    const ordersBySource = await this.prisma.order.groupBy({
      by: ['source'],
      where: {
        createdAt: { gte: start, lte: end },
      },
      _count: true,
    });

    // Daily orders
    const dailyOrders: Record<string, { total: number; completed: number; cancelled: number }> = {};
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
      },
      select: {
        orderStatus: true,
        createdAt: true,
      },
    });

    orders.forEach((order) => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      if (!dailyOrders[dateKey]) {
        dailyOrders[dateKey] = { total: 0, completed: 0, cancelled: 0 };
      }
      dailyOrders[dateKey].total++;
      if (order.orderStatus === 'COMPLETED') dailyOrders[dateKey].completed++;
      if (order.orderStatus === 'CANCELLED') dailyOrders[dateKey].cancelled++;
    });

    return {
      totalOrders: orders.length,
      ordersByStatus: ordersByStatus.map((s) => ({
        status: s.orderStatus,
        count: s._count,
      })),
      ordersByPayment: ordersByPayment.map((p) => ({
        method: p.paymentMethod,
        count: p._count,
      })),
      ordersBySource: ordersBySource.map((s) => ({
        source: s.source,
        count: s._count,
      })),
      dailyOrders: Object.entries(dailyOrders).map(([date, data]) => ({
        date,
        ...data,
      })),
    };
  }

  async getProductsReport(startDate?: string, endDate?: string, limit: number = 10) {
    const { start, end } = this.getDateRange(startDate, endDate);

    // Get order items from completed orders
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: start, lte: end },
          orderStatus: 'COMPLETED',
        },
      },
      select: {
        productId: true,
        productName: true,
        quantity: true,
        totalPrice: true,
      },
    });

    // Aggregate by product
    const productStats: Record<string, { name: string; sold: number; revenue: number }> = {};
    orderItems.forEach((item) => {
      if (!productStats[item.productId]) {
        productStats[item.productId] = { name: item.productName, sold: 0, revenue: 0 };
      }
      productStats[item.productId].sold += Number(item.quantity);
      productStats[item.productId].revenue += Number(item.totalPrice);
    });

    // Sort by revenue and take top N
    const topProducts = Object.entries(productStats)
      .map(([productId, stats]) => ({ productId, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    return {
      topProducts,
      totalProductsSold: orderItems.reduce((sum, i) => sum + Number(i.quantity), 0),
      totalRevenue: orderItems.reduce((sum, i) => sum + Number(i.totalPrice), 0),
    };
  }

  async getCustomersReport(startDate?: string, endDate?: string, limit: number = 10) {
    const { start, end } = this.getDateRange(startDate, endDate);

    // Get customer orders
    const customerOrders = await this.prisma.order.groupBy({
      by: ['userId', 'customerName', 'customerPhone'],
      where: {
        createdAt: { gte: start, lte: end },
        userId: { not: null },
        orderStatus: 'COMPLETED',
      },
      _count: true,
      _sum: { totalAmount: true },
    });

    // Sort by total spent
    const topCustomers = customerOrders
      .map((c) => ({
        userId: c.userId,
        name: c.customerName,
        phone: c.customerPhone,
        orderCount: c._count,
        totalSpent: Number(c._sum.totalAmount || 0),
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);

    // New customers in period
    const newCustomers = await this.prisma.profile.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        role: 'CUSTOMER',
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      topCustomers,
      newCustomers: newCustomers.map((c) => ({
        id: c.id,
        name: c.fullName || 'Khách hàng',
        phone: c.phone || '',
        email: c.email || '',
        registeredAt: c.createdAt,
      })),
      totalNewCustomers: newCustomers.length,
    };
  }

  async getInventoryReport() {
    // Low stock items
    const inventory = await this.prisma.inventory.findMany({
      where: {
        quantity: { lt: 10 }, // Less than 10 units
      },
      include: {
        product: {
          select: { name: true, status: true },
        },
        variant: {
          select: { name: true, sku: true },
        },
      },
      orderBy: { quantity: 'asc' },
    });

    // Out of stock
    const outOfStock = inventory.filter((i) => Number(i.quantity) === 0);
    const lowStock = inventory.filter((i) => Number(i.quantity) > 0 && Number(i.quantity) <= 5);
    const warningStock = inventory.filter((i) => Number(i.quantity) > 5 && Number(i.quantity) < 10);

    // All inventory summary
    const allInventory = await this.prisma.inventory.aggregate({
      _sum: { quantity: true },
      _count: true,
    });

    return {
      lowStockItems: inventory.map((i) => ({
        id: i.id,
        productName: i.product.name,
        variantName: i.variant?.name || null,
        sku: i.variant?.sku || null,
        quantity: Number(i.quantity),
        threshold: Number(i.lowStockThreshold),
        status: i.product.status,
      })),
      outOfStockCount: outOfStock.length,
      lowStockCount: lowStock.length,
      warningCount: warningStock.length,
      totalProducts: allInventory._count,
      totalQuantity: Number(allInventory._sum.quantity || 0),
    };
  }

  async exportRevenueCsv(startDate?: string, endDate?: string) {
    const { start, end } = this.getDateRange(startDate, endDate);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        orderStatus: 'COMPLETED',
        paymentStatus: 'PAID',
      },
      select: {
        orderCode: true,
        customerName: true,
        customerPhone: true,
        totalAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const headers = ['Mã đơn', 'Khách hàng', 'Điện thoại', 'Tổng tiền', 'Ngày tạo'];
    const rows = orders.map((o) => [
      o.orderCode,
      o.customerName,
      o.customerPhone,
      Number(o.totalAmount).toString(),
      o.createdAt.toISOString().split('T')[0],
    ]);

    return { headers, rows };
  }

  async exportOrdersCsv(startDate?: string, endDate?: string) {
    const { start, end } = this.getDateRange(startDate, endDate);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
      },
      select: {
        orderCode: true,
        customerName: true,
        customerPhone: true,
        orderStatus: true,
        paymentMethod: true,
        paymentStatus: true,
        totalAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const headers = ['Mã đơn', 'Khách hàng', 'Điện thoại', 'Trạng thái', 'Thanh toán', 'PT thanh toán', 'Tổng tiền', 'Ngày tạo'];
    const rows = orders.map((o) => [
      o.orderCode,
      o.customerName,
      o.customerPhone,
      o.orderStatus,
      o.paymentStatus,
      o.paymentMethod,
      Number(o.totalAmount).toString(),
      o.createdAt.toISOString().split('T')[0],
    ]);

    return { headers, rows };
  }

  async exportProductsCsv(startDate?: string, endDate?: string, limit: number = 50) {
    const { start, end } = this.getDateRange(startDate, endDate);

    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: start, lte: end },
          orderStatus: 'COMPLETED',
        },
      },
      select: {
        productId: true,
        productName: true,
        quantity: true,
        totalPrice: true,
      },
    });

    // Aggregate
    const productStats: Record<string, { name: string; sold: number; revenue: number }> = {};
    orderItems.forEach((item) => {
      if (!productStats[item.productId]) {
        productStats[item.productId] = { name: item.productName, sold: 0, revenue: 0 };
      }
      productStats[item.productId].sold += Number(item.quantity);
      productStats[item.productId].revenue += Number(item.totalPrice);
    });

    const sortedProducts = Object.entries(productStats)
      .map(([productId, stats]) => ({ productId, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    const headers = ['Mã sản phẩm', 'Tên sản phẩm', 'Số lượng bán', 'Doanh thu'];
    const rows = sortedProducts.map((p) => [
      p.productId,
      p.name,
      p.sold.toString(),
      p.revenue.toString(),
    ]);

    return { headers, rows };
  }
}
