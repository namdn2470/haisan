import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@hsbx/db';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const data = await this.prisma.promotion.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { data };
  }

  async findOne(id: string) {
    const data = await this.prisma.promotion.findUnique({ where: { id } });
    if (!data) throw new NotFoundException('Promotion not found');
    return { data };
  }

  async findByCode(code: string) {
    const data = await this.prisma.promotion.findUnique({ where: { code } });
    if (!data) throw new NotFoundException('Promotion not found');
    return { data };
  }

  async create(dto: any) {
    const data = await this.prisma.promotion.create({ data: dto });
    return { data };
  }

  async update(id: string, dto: any) {
    const data = await this.prisma.promotion.update({ where: { id }, data: dto });
    return { data };
  }

  async remove(id: string) {
    await this.prisma.promotion.delete({ where: { id } });
    return { message: 'Deleted' };
  }
}
