import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@hsbx/db';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(options?: { includeInactive?: boolean }) {
    const data = await this.prisma.category.findMany({
      where: options?.includeInactive ? {} : { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { products: true } },
        children: {
          where: options?.includeInactive ? {} : { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: { _count: { select: { products: true } } },
        },
      },
    });
    return { data };
  }

  async findOne(id: string, options?: { includeInactive?: boolean }) {
    const cat = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: { _count: { select: { products: true } } },
        },
      },
    });
    if (!cat || (!options?.includeInactive && !cat.isActive)) {
      throw new NotFoundException('Danh mục không tồn tại');
    }
    return { data: cat };
  }

  private slugify(text: string) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  async create(dto: any) {
    if (!dto.name) {
      throw new BadRequestException('Tên danh mục là bắt buộc');
    }

    const slug = dto.slug || this.slugify(dto.name);
    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) {
      throw new BadRequestException('Slug đã tồn tại, vui lòng chọn slug khác');
    }

    // Get max sortOrder if not provided
    let sortOrder = dto.sortOrder;
    if (sortOrder === undefined || sortOrder === null) {
      const maxCat = await this.prisma.category.findFirst({
        where: { parentId: dto.parentId || null },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      });
      sortOrder = (maxCat?.sortOrder ?? 0) + 1;
    }

    const data = await this.prisma.category.create({
      data: {
        name: dto.name.trim(),
        slug,
        parentId: dto.parentId || null,
        description: dto.description?.trim() || null,
        imageUrl: dto.imageUrl || null,
        iconUrl: dto.iconUrl || null,
        sortOrder: Number(sortOrder) || 0,
        isActive: dto.isActive !== false,
      },
      include: { _count: { select: { products: true } } },
    });
    return { data };
  }

  async update(id: string, dto: any) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Danh mục không tồn tại');

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name.trim();

    if (dto.slug !== undefined) {
      const newSlug = dto.slug || this.slugify(dto.name || cat.name);
      if (newSlug !== cat.slug) {
        const existing = await this.prisma.category.findUnique({ where: { slug: newSlug } });
        if (existing) {
          throw new BadRequestException('Slug đã tồn tại, vui lòng chọn slug khác');
        }
        data.slug = newSlug;
      }
    }

    if (dto.parentId !== undefined) data.parentId = dto.parentId || null;
    if (dto.description !== undefined) data.description = dto.description?.trim() || null;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl || null;
    if (dto.iconUrl !== undefined) data.iconUrl = dto.iconUrl || null;
    if (dto.sortOrder !== undefined) data.sortOrder = Number(dto.sortOrder);
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    const updated = await this.prisma.category.update({
      where: { id },
      data,
      include: { _count: { select: { products: true } } },
    });
    return { data: updated };
  }

  async remove(id: string) {
    const cat = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!cat) throw new NotFoundException('Danh mục không tồn tại');

    // Check if has children
    const children = await this.prisma.category.findMany({
      where: { parentId: id },
      select: { id: true },
    });

    if (children.length > 0) {
      throw new BadRequestException('Danh mục có danh mục con, vui lòng xóa danh mục con trước');
    }

    // Check if has products
    if (cat._count.products > 0) {
      // Soft delete - just deactivate
      await this.prisma.category.update({
        where: { id },
        data: { isActive: false },
      });
      return {
        message: 'Danh mục có sản phẩm nên được chuyển sang trạng thái ẩn thay vì xóa',
        softDeleted: true,
      };
    }

    await this.prisma.category.delete({ where: { id } });
    return { message: 'Đã xóa danh mục', softDeleted: false };
  }
}
