import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@hsbx/db';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId?: string) {
    const where = userId ? { userId } : {};
    const data = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
    return { data };
  }

  async findOne(id: string) {
    const data = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, payments: true, deliveries: true },
    });
    if (!data) throw new NotFoundException('Order not found');
    return { data };
  }

  async create(userId: string, dto: any) {
    const cart = await this.prisma.cart.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { items: { include: { product: true, variant: true } } },
    });

    if (!cart || !cart.items.length) throw new NotFoundException('Cart is empty');

    const subtotal = cart.items.reduce((s: number, i: any) => s + Number(i.priceAtTime) * Number(i.quantity), 0);

    const data = await this.prisma.order.create({
      data: {
        userId,
        orderCode: `ORD-${Date.now()}`,
        customerName: dto.customer_name,
        customerPhone: dto.customer_phone,
        shippingAddressText: dto.shipping_address_text,
        deliveryDate: new Date(),
        paymentMethod: dto.payment_method || 'COD',
        subtotal,
        totalAmount: subtotal + (dto.shipping_fee || 0) - (dto.discount_amount || 0),
        items: {
          create: cart.items.map((i: any) => ({
            productId: i.productId,
            variantId: i.variantId,
            productName: i.product.name,
            variantName: i.variant?.name || null,
            unit: i.selectedUnit,
            quantity: Number(i.quantity),
            price: Number(i.priceAtTime),
            totalPrice: Number(i.priceAtTime) * Number(i.quantity),
          })),
        },
      },
    });

    await this.prisma.cart.update({ where: { id: cart.id }, data: { status: 'CONVERTED' } });

    return { data };
  }

  async updateStatus(id: string, status: string) {
    const data = await this.prisma.order.update({ where: { id }, data: { orderStatus: status as any } });
    return { data };
  }
}
