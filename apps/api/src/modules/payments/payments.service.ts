import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@hsbx/db';
import { RealtimeService } from '../../realtime/realtime.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  async findAll(orderId?: string) {
    const where = orderId ? { orderId } : {};
    const data = await this.prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return { data };
  }

  async findOne(id: string) {
    const data = await this.prisma.payment.findUnique({ where: { id } });
    if (!data) throw new NotFoundException('Payment not found');
    return { data };
  }

  async create(dto: any) {
    const data = await this.prisma.payment.create({ data: dto });
    return { data };
  }

  async updateStatus(id: string, status: string) {
    const data = await this.prisma.payment.update({
      where: { id },
      data: { status: status as any },
      include: {
        order: { select: { id: true, orderCode: true, userId: true, orderStatus: true, customerName: true, totalAmount: true, createdAt: true, updatedAt: true } },
      },
    });
    if (status === 'PAID') {
      const notification = await this.prisma.notification.create({
        data: {
          type: 'ORDER_PAID',
          title: 'Thanh toán thành công',
          message: `Đơn hàng ${data.order?.orderCode || '#' + data.orderId.slice(0, 8)} đã thanh toán thành công`,
          data: { orderId: data.orderId, paymentId: data.id, amount: Number(data.amount) },
        },
      });
      this.realtime.emitNotificationNew(this.realtime.createPayload({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        createdAt: notification.createdAt.toISOString(),
      }));
      if (data.order) {
        const orderPayload = {
          id: data.order.id,
          orderCode: data.order.orderCode,
          status: data.order.orderStatus,
          customerName: data.order.customerName,
          totalAmount: Number(data.order.totalAmount),
          createdAt: data.order.createdAt.toISOString(),
          updatedAt: data.order.updatedAt.toISOString(),
        };
        this.realtime.emitOrderUpdated(orderPayload, data.order.userId);
        this.realtime.emitDashboardUpdated({ source: 'payment:paid', orderId: data.order.id, paymentId: data.id });
      }
    }
    const { order: _order, ...payment } = data as any;
    return { data: payment };
  }
}
