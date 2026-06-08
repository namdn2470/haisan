import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@hsbx/db';

@Injectable()
export class CartsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreate(userId?: string, sessionId?: string) {
    const where: any = userId ? { userId } : { sessionId };
    let cart = await this.prisma.cart.findFirst({
      where,
      include: { items: { include: { product: true, variant: true } } },
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: userId ? { userId } : { sessionId: sessionId || '' },
        include: { items: { include: { product: true, variant: true } } },
      });
    }
    return { data: cart };
  }

  async addItem(userId: string | undefined, sessionId: string | undefined, dto: any) {
    const where: any = userId ? { userId } : { sessionId };
    let cart = await this.prisma.cart.findFirst({ where });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: userId ? { userId } : { sessionId: sessionId || '' },
      });
    }

    const item = await this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: dto.product_id,
        variantId: dto.variant_id || null,
        quantity: dto.quantity || 1,
        selectedUnit: dto.selected_unit || 'KG',
        processingServiceId: dto.processing_service_id || null,
        priceAtTime: dto.price_at_time,
        note: dto.note || null,
      },
    });
    return { data: item };
  }

  async updateItem(userId: string, itemId: string, dto: any) {
    const existing = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId, status: 'ACTIVE' } },
    });
    if (!existing) throw new NotFoundException('Cart item not found');

    const item = await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
      include: { product: true, variant: true },
    });
    return { data: item };
  }

  async removeItem(userId: string, itemId: string) {
    const existing = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId, status: 'ACTIVE' } },
    });
    if (!existing) throw new NotFoundException('Cart item not found');

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return { message: 'Item removed' };
  }

  async clear(userId?: string, sessionId?: string) {
    const where: any = userId ? { userId } : { sessionId };
    const cart = await this.prisma.cart.findFirst({ where });
    if (cart) {
      await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    return { message: 'Cart cleared' };
  }
}
