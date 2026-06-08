import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@hsbx/db';

@Injectable()
export class BannersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { position?: string; isActive?: boolean; search?: string; publicOnly?: boolean }) {
    const { position, isActive, search, publicOnly } = params;
    const where: any = {};
    if (position) where.position = position;
    if (isActive !== undefined) where.isActive = isActive;
    if (publicOnly) {
      const now = new Date();
      where.AND = [
        { OR: [{ startAt: null }, { startAt: { lte: now } }] },
        { OR: [{ endAt: null }, { endAt: { gte: now } }] },
      ];
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { subtitle: { contains: search, mode: 'insensitive' } },
      ];
    }
    const data = await this.prisma.banner.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
    return { data };
  }

  async findOne(id: string) {
    const data = await this.prisma.banner.findUnique({ where: { id } });
    if (!data) throw new NotFoundException('Banner không tồn tại');
    return { data };
  }

  async create(dto: any) {
    if (!dto.title?.trim()) throw new BadRequestException('Tiêu đề là bắt buộc');
    if (!dto.imageUrl?.trim()) throw new BadRequestException('Ảnh banner là bắt buộc');
    if (!dto.position) throw new BadRequestException('Vị trí hiển thị là bắt buộc');

    const maxSort = await this.prisma.banner.aggregate({
      _max: { sortOrder: true },
      where: { position: dto.position },
    });

    const data = await this.prisma.banner.create({
      data: {
        title: dto.title.trim(),
        subtitle: dto.subtitle?.trim() || null,
        imageUrl: dto.imageUrl.trim(),
        linkUrl: dto.linkUrl?.trim() || null,
        position: dto.position,
        sortOrder: dto.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
        isActive: dto.isActive !== false,
        startAt: dto.startAt ? new Date(dto.startAt) : null,
        endAt: dto.endAt ? new Date(dto.endAt) : null,
      },
    });
    return { data };
  }

  async update(id: string, dto: any) {
    const existing = await this.prisma.banner.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Banner không tồn tại');

    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title.trim();
    if (dto.subtitle !== undefined) updateData.subtitle = dto.subtitle?.trim() || null;
    if (dto.imageUrl !== undefined) updateData.imageUrl = dto.imageUrl.trim();
    if (dto.linkUrl !== undefined) updateData.linkUrl = dto.linkUrl?.trim() || null;
    if (dto.position !== undefined) updateData.position = dto.position;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.startAt !== undefined) updateData.startAt = dto.startAt ? new Date(dto.startAt) : null;
    if (dto.endAt !== undefined) updateData.endAt = dto.endAt ? new Date(dto.endAt) : null;

    const data = await this.prisma.banner.update({
      where: { id },
      data: updateData,
    });
    return { data };
  }

  async remove(id: string) {
    const existing = await this.prisma.banner.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Banner không tồn tại');
    await this.prisma.banner.delete({ where: { id } });
    return { message: 'Đã xóa banner' };
  }
}
