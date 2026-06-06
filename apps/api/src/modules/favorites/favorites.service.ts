import { Injectable } from '@nestjs/common';
import { PrismaService } from '@hsbx/db';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const data = await this.prisma.favorite.findMany({
      where: { userId },
      include: {
        product: {
          include: { images: { where: { isThumbnail: true }, take: 1 } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { data };
  }

  async toggle(userId: string, productId: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { data: { favorited: false } };
    }

    await this.prisma.favorite.create({
      data: { userId, productId },
    });
    return { data: { favorited: true } };
  }

  async check(userId: string, productId: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    return { data: { favorited: !!existing } };
  }
}
