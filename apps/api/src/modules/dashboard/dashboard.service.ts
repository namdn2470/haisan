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

    return {
      today_orders: todayOrders,
      today_revenue: Number(todayRevenue._sum?.totalAmount ?? 0),
      new_orders: newOrders,
      delivering_orders: delivering,
      completed_orders: completed,
      processing_orders: processing,
    };
  }

  async getRevenue() {
    const rows = await this.prisma.$queryRaw<Array<{ day: Date; order_count: number; revenue: unknown }>>`
      SELECT DATE(created_at) as day, COUNT(*)::int as order_count, COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE order_status NOT IN ('CANCELLED', 'RETURNED')
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY day DESC
    `;
    return rows.map(r => ({
      day: r.day,
      order_count: Number(r.order_count),
      revenue: Number(r.revenue),
    }));
  }

  async getBestSellers() {
    const rows = await this.prisma.$queryRaw<Array<{ id: string; name: string; slug: string; sold_count: number; rating_avg: unknown; total_qty_sold: unknown }>>`
      SELECT p.id, p.name, p.slug, p.sold_count, p.rating_avg, COALESCE(SUM(oi.quantity), 0) as total_qty_sold
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o ON o.id = oi.order_id AND o.order_status NOT IN ('CANCELLED', 'RETURNED')
      GROUP BY p.id, p.name, p.slug, p.sold_count, p.rating_avg
      ORDER BY total_qty_sold DESC
      LIMIT 10
    `;
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      sold_count: Number(r.sold_count),
      rating_avg: Number(r.rating_avg ?? 0),
      total_qty_sold: Number(r.total_qty_sold),
    }));
  }
}
