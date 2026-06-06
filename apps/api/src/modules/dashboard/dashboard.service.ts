import { Injectable } from '@nestjs/common';
import { PrismaService } from '@hsbx/db';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await this.prisma.order.count({ where: { createdAt: { gte: today } } });
    const todayRevenue = await this.prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { createdAt: { gte: today }, orderStatus: { notIn: ['CANCELLED', 'RETURNED'] } },
    });
    const newOrders = await this.prisma.order.count({ where: { orderStatus: 'NEW' } });
    const delivering = await this.prisma.order.count({ where: { orderStatus: 'DELIVERING' } });
    const completed = await this.prisma.order.count({ where: { orderStatus: 'COMPLETED' } });
    const processing = await this.prisma.order.count({ where: { orderStatus: { in: ['CONFIRMED', 'PREPARING'] } } });

    const data = {
      today_orders: todayOrders,
      today_revenue: todayRevenue._sum?.totalAmount || 0,
      new_orders: newOrders,
      delivering_orders: delivering,
      completed_orders: completed,
      processing_orders: processing,
    };
    return { data };
  }

  async getRevenue() {
    const data = await this.prisma.$queryRaw`
      SELECT DATE(created_at) as day, COUNT(*) as order_count, SUM(total_amount) as revenue
      FROM orders
      WHERE order_status NOT IN ('CANCELLED', 'RETURNED')
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY day DESC
    `;
    return { data };
  }

  async getBestSellers() {
    const data = await this.prisma.$queryRaw`
      SELECT p.id, p.name, p.slug, p.sold_count, p.rating_avg, SUM(oi.quantity) as total_qty_sold
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o ON o.id = oi.order_id AND o.order_status NOT IN ('CANCELLED', 'RETURNED')
      GROUP BY p.id, p.name, p.slug, p.sold_count, p.rating_avg
      ORDER BY total_qty_sold DESC
      LIMIT 10
    `;
    return { data };
  }
}
