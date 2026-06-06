import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@hsbx/db';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId?: string) {
    const where = userId ? { userId } : {};
    const data = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return { data };
  }

  async findOne(id: string) {
    const data = await this.prisma.notification.findUnique({ where: { id } });
    if (!data) throw new NotFoundException('Notification not found');
    return { data };
  }

  async create(dto: any) {
    const data = await this.prisma.notification.create({ data: dto });
    return { data };
  }

  async markRead(id: string) {
    const data = await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return { data };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { message: 'All marked as read' };
  }
}
