import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@hsbx/db';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
    publicOnly?: boolean;
  }) {
    const { search, status, page = 1, limit = 10, publicOnly } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (publicOnly) {
      where.status = 'PUBLISHED';
      where.publishedAt = { not: null };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.post.count({ where }),
    ]);

    const mapped = data.map(p => ({
      ...p,
      authorId: p.author?.id || null,
      authorName: p.author?.fullName || null,
    }));

    return {
      data: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const data = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
    if (!data) throw new NotFoundException('Bài viết không tồn tại');
    return {
      data: {
        ...data,
        authorId: data.author?.id || null,
        authorName: data.author?.fullName || null,
      },
    };
  }

  async findBySlug(slug: string, publicOnly = false) {
    const data = await this.prisma.post.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
    if (!data || (publicOnly && data.status !== 'PUBLISHED')) {
      throw new NotFoundException('Bài viết không tồn tại');
    }
    return {
      data: {
        ...data,
        authorId: data.author?.id || null,
        authorName: data.author?.fullName || null,
      },
    };
  }

  async create(dto: any) {
    if (!dto.title?.trim()) throw new BadRequestException('Tiêu đề là bắt buộc');

    let slug = dto.slug?.trim() || slugify(dto.title.trim());
    if (!slug) throw new BadRequestException('Slug không hợp lệ');

    const existingSlug = await this.prisma.post.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const publishedAt = dto.status === 'PUBLISHED' ? new Date() : null;

    const data = await this.prisma.post.create({
      data: {
        title: dto.title.trim(),
        slug,
        thumbnailUrl: dto.thumbnailUrl || null,
        excerpt: dto.excerpt?.trim() || null,
        content: dto.content || null,
        authorId: dto.authorId || null,
        status: dto.status || 'DRAFT',
        seoTitle: dto.seoTitle?.trim() || null,
        seoDescription: dto.seoDescription?.trim() || null,
        publishedAt,
        viewCount: 0,
      },
    });

    return { data };
  }

  async update(id: string, dto: any) {
    const existing = await this.prisma.post.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Bài viết không tồn tại');

    let slug = existing.slug;
    if (dto.slug !== undefined && dto.slug.trim() !== existing.slug) {
      slug = dto.slug.trim();
      const duplicate = await this.prisma.post.findUnique({ where: { slug } });
      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException(`Slug "${slug}" đã tồn tại`);
      }
    }

    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title.trim();
    if (dto.slug !== undefined) updateData.slug = slug;
    if (dto.thumbnailUrl !== undefined) updateData.thumbnailUrl = dto.thumbnailUrl || null;
    if (dto.excerpt !== undefined) updateData.excerpt = dto.excerpt?.trim() || null;
    if (dto.content !== undefined) updateData.content = dto.content || null;
    if (dto.status !== undefined) {
      updateData.status = dto.status;
      if (dto.status === 'PUBLISHED' && !existing.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }
    if (dto.seoTitle !== undefined) updateData.seoTitle = dto.seoTitle?.trim() || null;
    if (dto.seoDescription !== undefined) updateData.seoDescription = dto.seoDescription?.trim() || null;

    const data = await this.prisma.post.update({
      where: { id },
      data: updateData,
    });

    return { data };
  }

  async remove(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { author: { select: { id: true } } },
    });
    if (!post) throw new NotFoundException('Bài viết không tồn tại');

    await this.prisma.post.delete({ where: { id } });
    return { message: 'Đã xóa bài viết' };
  }
}
