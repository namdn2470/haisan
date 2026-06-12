import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@hsbx/db';
import { RealtimeService } from '../../realtime/realtime.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  async findAll(userId?: string) {
    const where: any = {};
    if (userId) {
      where.OR = [{ userId }, { userId: null }];
    }
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
    this.realtime.emitNotificationNew(this.realtime.createPayload({
      id: data.id,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data,
      createdAt: data.createdAt.toISOString(),
    }), data.userId);
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
