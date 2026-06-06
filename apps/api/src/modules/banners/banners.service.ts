import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@hsbx/db';

@Injectable()
export class BannersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(position?: string) {
    const where: any = { isActive: true };
    if (position) where.position = position;
    const data = await this.prisma.banner.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
    return { data };
  }

  async findOne(id: string) {
    const data = await this.prisma.banner.findUnique({ where: { id } });
    if (!data) throw new NotFoundException('Banner not found');
    return { data };
  }

  async create(dto: any) {
    const data = await this.prisma.banner.create({ data: dto });
    return { data };
  }

  async update(id: string, dto: any) {
    const data = await this.prisma.banner.update({ where: { id }, data: dto });
    return { data };
  }

  async remove(id: string) {
    await this.prisma.banner.delete({ where: { id } });
    return { message: 'Deleted' };
  }
}
