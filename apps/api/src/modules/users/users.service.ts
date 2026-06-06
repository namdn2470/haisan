import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@hsbx/db';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const data = await this.prisma.profile.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { data };
  }

  async findOne(id: string) {
    const data = await this.prisma.profile.findUnique({ where: { id } });
    if (!data) throw new NotFoundException('User not found');
    return { data };
  }

  async update(id: string, dto: any) {
    const data = await this.prisma.profile.update({ where: { id }, data: dto });
    return { data };
  }

  async remove(id: string) {
    await this.prisma.profile.delete({ where: { id } });
    return { message: 'Deleted' };
  }
}
