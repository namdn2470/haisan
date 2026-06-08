import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@hsbx/db';
import { isAdminRole } from '../../common/roles.decorator';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  async findAll(userId?: string, role?: string, params?: {
    search?: string;
    status?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status, paymentStatus, startDate, endDate, page = 1, limit = 10 } = params || {};

    const where: any = {};

    if (!isAdminRole(role) && userId) {
      where.userId = userId;
    }

    // Search by order code, customer name, or phone
    if (search) {
      where.OR = [
        { orderCode: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Status filter
    if (status) {
      where.orderStatus = status;
    }

    // Payment status filter
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Count total
    const total = await this.prisma.order.count({ where });

    // Get paginated data
    const data = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        items: { include: { product: { select: { images: true } } } },
        user: { select: { fullName: true, phone: true, email: true } },
      },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId?: string, role?: string) {
    const isAdmin = isAdminRole(role);
    const data = this.isUuid(id)
      ? await this.prisma.order.findFirst({
          where: isAdmin ? { id } : { id, userId },
          include: {
            items: { include: { product: { select: { images: true } } } },
            user: { select: { fullName: true, phone: true, email: true } },
          },
        })
      : await this.prisma.order.findFirst({
          where: { orderCode: id, ...(isAdmin ? {} : { userId }) },
          include: {
            items: { include: { product: { select: { images: true } } } },
            user: { select: { fullName: true, phone: true, email: true } },
          },
        });

    if (!data) {
      throw new NotFoundException('Order not found');
    }
    return { data };
  }

  async findByOrderCode(orderCode?: string) {
    if (!orderCode) return { data: [] };

    const orders = await this.prisma.order.findMany({
      where: {
        orderCode: { contains: orderCode, mode: 'insensitive' },
      },
      include: {
        items: true,
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    return { data: orders };
  }

  async create(userId: string | undefined, dto: any) {
    const payloadItems = Array.isArray(dto.items) ? dto.items : [];
    const cart = userId && payloadItems.length === 0
      ? await this.prisma.cart.findFirst({
          where: { userId, status: 'ACTIVE' },
          include: { items: { include: { product: true, variant: true } } },
        })
      : null;

    const items = payloadItems.length
      ? payloadItems.map((item: any) => ({
          productId: item.product_id || item.productId,
          variantId: item.variant_id || item.variantId || null,
          productName: item.product_name || item.productName || 'Sản phẩm',
          variantName: item.variant_name || item.variantName || null,
          unit: String(item.selected_unit || item.selectedUnit || 'KG').toUpperCase(),
          quantity: Number(item.quantity || 1),
          price: Number(item.price_at_time || item.priceAtTime || 0),
        }))
      : (cart?.items || []).map((item: any) => ({
          productId: item.productId,
          variantId: item.variantId,
          productName: item.product.name,
          variantName: item.variant?.name || null,
          unit: item.selectedUnit,
          quantity: Number(item.quantity),
          price: Number(item.priceAtTime),
        }));

    if (!items.length) throw new NotFoundException('Cart is empty');

    const UNIMPLEMENTED_PAYMENT_METHODS = ['MOMO', 'ZALO_PAY'];
    if (UNIMPLEMENTED_PAYMENT_METHODS.includes(dto.payment_method)) {
      throw new BadRequestException('Phương thức thanh toán này chưa được hỗ trợ');
    }

    const subtotal = items.reduce((s: number, i: any) => s + Number(i.price) * Number(i.quantity), 0);

    let discountAmount = Number(dto.discount_amount || 0);
    let appliedPromotion: any = null;

    if (dto.coupon_code && subtotal > 0) {
      const promo = await this.prisma.promotion.findFirst({
        where: {
          code: dto.coupon_code.trim().toUpperCase(),
          isActive: true,
          startAt: { lte: new Date() },
          endAt: { gte: new Date() },
        },
      });
      if (!promo) {
        throw new BadRequestException('Mã giảm giá không hợp lệ hoặc đã hết hạn');
      }
      if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
        throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');
      }
      const minOrder = Number(promo.minOrderAmount || 0);
      if (minOrder > 0 && subtotal < minOrder) {
        throw new BadRequestException(`Đơn hàng tối thiểu ${minOrder.toLocaleString('vi-VN')}đ để áp dụng mã này`);
      }
      const discountValue = Number(promo.discountValue || 0);
      const maxDiscount = promo.maxDiscountAmount ? Number(promo.maxDiscountAmount) : 0;
      let calculatedDiscount = promo.discountType === 'PERCENT'
        ? Math.round((subtotal * discountValue) / 100)
        : discountValue;
      if (maxDiscount > 0) calculatedDiscount = Math.min(calculatedDiscount, maxDiscount);
      discountAmount = Math.max(0, Math.min(calculatedDiscount, subtotal));
      appliedPromotion = promo;
    }

    const shippingFee = Number(dto.shipping_fee || 0);
    const totalAmount = Math.max(0, subtotal + shippingFee - discountAmount);

    const order = await this.prisma.order.create({
      data: {
        userId: userId || null,
        orderCode: `ORD-${Date.now()}`,
        customerName: dto.customer_name,
        customerPhone: dto.customer_phone,
        customerEmail: dto.customer_email || null,
        shippingAddressText: dto.shipping_address_text,
        deliveryDate: new Date(),
        paymentMethod: dto.payment_method || 'COD',
        subtotal,
        totalAmount,
        shippingFee,
        discountAmount,
        customerNote: dto.note || null,
        items: {
          create: items.map((i: any) => ({
            productId: i.productId,
            variantId: i.variantId || null,
            productName: i.productName || 'Sản phẩm',
            variantName: i.variantName || null,
            unit: String(i.unit || 'KG').toUpperCase(),
            quantity: Number(i.quantity || 1),
            price: Number(i.price || 0),
            totalPrice: Number(i.price || 0) * Number(i.quantity || 1),
          })),
        },
      },
      include: { items: true },
    });

    // Create initial status history
    await this.prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: 'NEW',
        note: 'Đơn hàng được tạo',
        actorName: 'System',
      },
    });

    if (appliedPromotion) {
      await this.prisma.orderCoupon.create({
        data: {
          orderId: order.id,
          promotionId: appliedPromotion.id,
          discountAmount,
        },
      });
      await this.prisma.promotion.update({
        where: { id: appliedPromotion.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    if (cart) {
      await this.prisma.cart.update({ where: { id: cart.id }, data: { status: 'CONVERTED' } });
    } else if (userId) {
      const activeCart = await this.prisma.cart.findFirst({ where: { userId, status: 'ACTIVE' } });
      if (activeCart) {
        await this.prisma.cart.update({ where: { id: activeCart.id }, data: { status: 'CONVERTED' } });
      }
    }

    await this.prisma.notification.create({
      data: {
        type: 'ORDER_NEW',
        title: 'Đơn hàng mới',
        message: `Đơn hàng ${order.orderCode || '#' + order.id.slice(0, 8)} vừa được đặt`,
        data: { orderId: order.id, orderCode: order.orderCode },
      },
    });

    return { data: order };
  }

  async updateStatus(id: string, status: string, note?: string, actorName?: string) {
    // Get current order
    const currentOrder = await this.prisma.order.findUnique({ where: { id } });
    if (!currentOrder) throw new NotFoundException('Order not found');

    const oldStatus = currentOrder.orderStatus;

    // Update status
    const data = await this.prisma.order.update({
      where: { id },
      data: { orderStatus: status as any },
    });

    // Create status history
    await this.prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status,
        note: note || null,
        actorName: actorName || 'Admin',
      },
    });

    // Create notification
    const statusLabel = status === 'CONFIRMED' ? 'xác nhận' : status === 'PREPARING' ? 'chuẩn bị' : status === 'DELIVERING' ? 'giao hàng' : status === 'COMPLETED' ? 'hoàn thành' : status === 'CANCELLED' ? 'hủy' : status.toLowerCase();
    const notifType = status === 'COMPLETED' ? 'ORDER_DELIVERED' : 'SYSTEM';
    await this.prisma.notification.create({
      data: {
        type: notifType,
        title: 'Cập nhật đơn hàng',
        message: `Đơn hàng ${data.orderCode || '#' + id.slice(0, 8)} đã chuyển sang trạng thái ${statusLabel}`,
        data: { orderId: id, oldStatus, newStatus: status },
      },
    });

    return { data };
  }

  async updateNote(id: string, note: string) {
    const data = await this.prisma.order.update({
      where: { id },
      data: { adminNote: note },
    });
    return { data };
  }

  async getStatusHistory(id: string) {
    const data = await this.prisma.orderStatusHistory.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'desc' },
    });
    return { data };
  }
}
