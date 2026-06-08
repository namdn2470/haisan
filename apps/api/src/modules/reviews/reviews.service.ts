import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@hsbx/db';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    productId?: string;
    status?: string;
    search?: string;
    rating?: number;
    page?: number;
    limit?: number;
    publicOnly?: boolean;
  }) {
    const { productId, status, search, rating, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (productId) where.productId = productId;
    if (status) where.status = status;
    if (rating) where.rating = rating;
    if (search) {
      where.OR = [
        { comment: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          product: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    const mapped = data.map(r => ({
      id: r.id,
      productId: r.productId,
      productName: r.product?.name || '',
      userId: r.userId,
      customerName: r.user?.fullName || r.user?.email || 'Khách hàng',
      rating: r.rating,
      comment: r.comment || '',
      images: r.images || [],
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return { data: mapped, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, publicOnly = false) {
    const r = await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        product: { select: { id: true, name: true, images: true } },
      },
    });
    if (!r || (publicOnly && r.status !== 'APPROVED')) {
      throw new NotFoundException('Đánh giá không tồn tại');
    }
    return {
      data: {
        id: r.id,
        productId: r.productId,
        productName: r.product?.name || '',
        userId: r.userId,
        customerName: r.user?.fullName || r.user?.email || 'Khách hàng',
        rating: r.rating,
        comment: r.comment || '',
        images: r.images || [],
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      },
    };
  }

  async create(userId: string, dto: any) {
    const data = await this.prisma.review.create({
      data: { ...dto, userId },
    });
    return { data };
  }

  async updateStatus(id: string, status: string) {
    const existing = await this.prisma.review.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Đánh giá không tồn tại');

    const data = await this.prisma.review.update({
      where: { id },
      data: { status: status as any },
    });
    return { data };
  }

  async remove(id: string) {
    const existing = await this.prisma.review.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Đánh giá không tồn tại');
    await this.prisma.review.delete({ where: { id } });
    return { message: 'Đã xóa đánh giá' };
  }
}
