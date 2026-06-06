import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@hsbx/db';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(orderId?: string) {
    const where = orderId ? { orderId } : {};
    const data = await this.prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return { data };
  }

  async findOne(id: string) {
    const data = await this.prisma.payment.findUnique({ where: { id } });
    if (!data) throw new NotFoundException('Payment not found');
    return { data };
  }

  async create(dto: any) {
    const data = await this.prisma.payment.create({ data: dto });
    return { data };
  }

  async updateStatus(id: string, status: string) {
    const data = await this.prisma.payment.update({
      where: { id },
      data: { status: status as any },
    });
    return { data };
  }
}
