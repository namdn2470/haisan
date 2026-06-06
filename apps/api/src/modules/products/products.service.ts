import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@hsbx/db';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: { category?: string; search?: string; sort?: string; limit?: number; bestSeller?: boolean }) {
    const where: any = { status: 'ACTIVE' };
    if (filters.category) where.category = { slug: filters.category };
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { shortDescription: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.bestSeller) where.isBestSeller = true;

    const orderBy: any = {};
    if (filters.sort === 'sold') orderBy.soldCount = 'desc';
    else if (filters.sort === 'price_asc') orderBy.basePrice = 'asc';
    else if (filters.sort === 'price_desc') orderBy.basePrice = 'desc';
    else if (filters.sort === 'new') orderBy.createdAt = 'desc';
    else orderBy.soldCount = 'desc';

    const take = filters.limit || 20;
    const data = await this.prisma.product.findMany({
      where,
      orderBy,
      take,
      include: { images: { where: { isThumbnail: true }, take: 1 } },
    });
    return { data };
  }

  async findBySlug(slug: string) {
    const data = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        variants: { where: { isActive: true }, orderBy: { price: 'asc' } },
        images: { orderBy: { sortOrder: 'asc' } },
        processingOptions: { include: { processingService: true } },
        category: true,
      },
    });
    if (!data) throw new NotFoundException('Product not found');
    return { data };
  }

  async findOne(id: string) {
    const data = await this.prisma.product.findUnique({
      where: { id },
      include: { variants: true, images: true },
    });
    if (!data) throw new NotFoundException('Product not found');
    return { data };
  }

  async create(dto: any) {
    const data = await this.prisma.product.create({ data: dto });
    return { data };
  }

  async update(id: string, dto: any) {
    const data = await this.prisma.product.update({ where: { id }, data: dto });
    return { data };
  }

  async remove(id: string) {
    await this.prisma.product.delete({ where: { id } });
    return { message: 'Deleted' };
  }
}
