import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@hsbx/db';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(productId?: string) {
    const where = productId ? { productId } : {};
    const data = await this.prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return { data };
  }

  async findOne(id: string) {
    const data = await this.prisma.review.findUnique({ where: { id } });
    if (!data) throw new NotFoundException('Review not found');
    return { data };
  }

  async create(userId: string, dto: any) {
    const data = await this.prisma.review.create({
      data: { ...dto, userId },
    });
    return { data };
  }

  async updateStatus(id: string, status: string) {
    const data = await this.prisma.review.update({
      where: { id },
      data: { status: status as any },
    });
    return { data };
  }
}
