import { Injectable } from '@nestjs/common';
import { PrismaService } from '@hsbx/db';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const data = await this.prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });
    return { data };
  }

  async create(userId: string, dto: any) {
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    const data = await this.prisma.address.create({
      data: { ...dto, userId },
    });
    return { data };
  }

  async update(id: string, dto: any) {
    const data = await this.prisma.address.update({ where: { id }, data: dto });
    return { data };
  }

  async remove(id: string) {
    await this.prisma.address.delete({ where: { id } });
    return { message: 'Deleted' };
  }
}
