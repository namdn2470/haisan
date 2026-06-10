import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@hsbx/db';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { search, isActive, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.promotion.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.promotion.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const data = await this.prisma.promotion.findUnique({ where: { id } });
    if (!data) throw new NotFoundException('Khuyến mãi không tồn tại');
    return { data };
  }

  async findByCode(code: string) {
    const now = new Date();
    const data = await this.prisma.promotion.findFirst({
      where: {
        code: code.trim().toUpperCase(),
        isActive: true,
        startAt: { lte: now },
        endAt: { gte: now },
      },
    });
    if (!data || (data.usageLimit !== null && data.usedCount >= data.usageLimit)) {
      throw new NotFoundException('Khuyến mãi không tồn tại');
    }
    return { data };
  }

  async create(dto: any) {
    const code = (dto.code || '').trim().toUpperCase();
    if (!code) throw new BadRequestException('Mã giảm giá là bắt buộc');
    if (!dto.name?.trim()) throw new BadRequestException('Tên chương trình là bắt buộc');
    if (!dto.discountType) throw new BadRequestException('Loại giảm giá là bắt buộc');
    if (!dto.discountValue && dto.discountValue !== 0) throw new BadRequestException('Giá trị giảm là bắt buộc');
    if (!dto.startAt) throw new BadRequestException('Ngày bắt đầu là bắt buộc');
    if (!dto.endAt) throw new BadRequestException('Ngày kết thúc là bắt buộc');

    const existing = await this.prisma.promotion.findUnique({ where: { code } });
    if (existing) throw new BadRequestException(`Mã "${code}" đã tồn tại`);

    const data = await this.prisma.promotion.create({
      data: {
        code,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minOrderAmount: dto.minOrderAmount || 0,
        maxDiscountAmount: dto.maxDiscountAmount || null,
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
        usageLimit: dto.usageLimit || null,
        usedCount: 0,
        isActive: dto.isActive !== false,
      },
    });

    return { data };
  }

  async update(id: string, dto: any) {
    const existing = await this.prisma.promotion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Khuyến mãi không tồn tại');

    const code = dto.code ? dto.code.trim().toUpperCase() : existing.code;
    if (dto.code && dto.code.trim().toUpperCase() !== existing.code) {
      const duplicate = await this.prisma.promotion.findUnique({ where: { code } });
      if (duplicate) throw new BadRequestException(`Mã "${code}" đã tồn tại`);
    }

    const updateData: any = {};
    if (dto.code !== undefined) updateData.code = code;
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.description !== undefined) updateData.description = dto.description?.trim() || null;
    if (dto.discountType !== undefined) updateData.discountType = dto.discountType;
    if (dto.discountValue !== undefined) updateData.discountValue = dto.discountValue;
    if (dto.minOrderAmount !== undefined) updateData.minOrderAmount = dto.minOrderAmount;
    if (dto.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = dto.maxDiscountAmount || null;
    if (dto.startAt !== undefined) updateData.startAt = new Date(dto.startAt);
    if (dto.endAt !== undefined) updateData.endAt = new Date(dto.endAt);
    if (dto.usageLimit !== undefined) updateData.usageLimit = dto.usageLimit || null;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const data = await this.prisma.promotion.update({
      where: { id },
      data: updateData,
    });

    return { data };
  }

  async remove(id: string) {
    const promo = await this.prisma.promotion.findUnique({
      where: { id },
      include: { orderCoupons: { select: { id: true } } },
    });

    if (!promo) throw new NotFoundException('Khuyến mãi không tồn tại');

    if (promo.orderCoupons && promo.orderCoupons.length > 0) {
      await this.prisma.promotion.update({
        where: { id },
        data: { isActive: false },
      });
      return {
        message: 'Khuyến mãi đã được sử dụng nên được chuyển sang trạng thái ẩn',
        softDeleted: true,
      };
    }

    await this.prisma.promotion.delete({ where: { id } });
    return { message: 'Đã xóa khuyến mãi', softDeleted: false };
  }

  async validate(code: string, subtotal: number) {
    const now = new Date();
    const promo = await this.prisma.promotion.findFirst({
      where: {
        code: code.trim().toUpperCase(),
        isActive: true,
        startAt: { lte: now },
        endAt: { gte: now },
      },
    });

    if (!promo) {
      throw new NotFoundException('Mã khuyến mãi không tồn tại hoặc đã hết hạn');
    }

    if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
      throw new BadRequestException('Mã khuyến mãi đã hết lượt sử dụng');
    }

    const minOrder = Number(promo.minOrderAmount);
    if (minOrder > 0 && subtotal < minOrder) {
      throw new BadRequestException(
        `Đơn hàng tối thiểu ${minOrder.toLocaleString('vi-VN')}đ để sử dụng mã này`
      );
    }

    let discountAmount = 0;

    if (promo.discountType === 'PERCENT') {
      discountAmount = Math.floor((subtotal * Number(promo.discountValue)) / 100);
    } else if (promo.discountType === 'FIXED_AMOUNT') {
      discountAmount = Number(promo.discountValue);
    } else if (promo.discountType === 'FREE_SHIPPING') {
      // Free shipping discount = 0 in the order total; shipping fee handled separately
      discountAmount = 0;
    }

    // Apply max discount cap
    const maxDiscount = promo.maxDiscountAmount ? Number(promo.maxDiscountAmount) : 0;
    if (maxDiscount > 0) {
      discountAmount = Math.min(discountAmount, maxDiscount);
    }

    // Cap at subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    return {
      id: promo.id,
      code: promo.code,
      name: promo.name,
      discountType: promo.discountType,
      discountValue: Number(promo.discountValue),
      discountAmount,
      subtotal,
      finalTotal: subtotal - discountAmount,
      minOrderAmount: Number(promo.minOrderAmount),
      maxDiscountAmount: promo.maxDiscountAmount ? Number(promo.maxDiscountAmount) : null,
    };
  }
}
