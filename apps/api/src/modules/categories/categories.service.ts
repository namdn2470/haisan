import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@hsbx/db';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const data = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return { data };
  }

  async findOne(id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    return { data: cat };
  }

  async create(dto: { name: string; slug: string; imageUrl?: string }) {
    const data = await this.prisma.category.create({ data: dto });
    return { data };
  }

  async update(id: string, dto: Partial<{ name: string; slug: string; imageUrl: string; isActive: boolean }>) {
    const data = await this.prisma.category.update({ where: { id }, data: dto });
    return { data };
  }

  async remove(id: string) {
    await this.prisma.category.delete({ where: { id } });
    return { message: 'Deleted' };
  }
}
