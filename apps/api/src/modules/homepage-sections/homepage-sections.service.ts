import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@hsbx/db';

export type HomeSectionPublic = {
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaUrl?: string;
  enabled: boolean;
  maxItems: number;
  products: {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    oldPrice?: number;
    unit: string;
    shortDescription?: string;
    badge?: string;
    images: { imageUrl: string }[];
    status: string;
  }[];
};

@Injectable()
export class HomepageSectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllAdmin() {
    const sections = await this.prisma.homepageSection.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                basePrice: true,
                oldPrice: true,
                unit: true,
                shortDescription: true,
                badge: true,
                status: true,
                images: {
                  orderBy: [{ isThumbnail: 'desc' }, { sortOrder: 'asc' }],
                  take: 1,
                  select: { imageUrl: true },
                },
              },
            },
          },
        },
      },
    });
    return sections.map((s) => ({
      ...s,
      items: s.items.map((item) => ({ ...item })),
    }));
  }

  async findOneAdmin(slug: string) {
    const section = await this.prisma.homepageSection.findUnique({
      where: { slug },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                basePrice: true,
                oldPrice: true,
                unit: true,
                shortDescription: true,
                badge: true,
                status: true,
                images: {
                  orderBy: [{ isThumbnail: 'desc' }, { sortOrder: 'asc' }],
                  take: 1,
                  select: { imageUrl: true },
                },
              },
            },
          },
        },
      },
    });
    if (!section) throw new NotFoundException('Section không tồn tại');
    return {
      ...section,
      items: section.items.map((item) => ({ ...item })),
    };
  }

  async upsertSection(slug: string, dto: any) {
    const { items: itemDtos, ...sectionData } = dto;

    const section = await this.prisma.homepageSection.upsert({
      where: { slug },
      create: {
        slug,
        title: sectionData.title ?? '',
        subtitle: sectionData.subtitle ?? null,
        description: sectionData.description ?? null,
        ctaText: sectionData.ctaText ?? null,
        ctaUrl: sectionData.ctaUrl ?? null,
        enabled: sectionData.enabled ?? true,
        sortOrder: sectionData.sortOrder ?? 0,
        maxItems: sectionData.maxItems ?? 3,
      },
      update: {
        title: sectionData.title ?? '',
        subtitle: sectionData.subtitle ?? null,
        description: sectionData.description ?? null,
        ctaText: sectionData.ctaText ?? null,
        ctaUrl: sectionData.ctaUrl ?? null,
        enabled: sectionData.enabled ?? true,
        sortOrder: sectionData.sortOrder ?? 0,
        maxItems: sectionData.maxItems ?? 3,
      },
    });

    if (Array.isArray(itemDtos)) {
      await this.prisma.homepageSectionItem.deleteMany({
        where: { sectionId: section.id },
      });

      const validProductIds = itemDtos
        .map((d) => d.productId)
        .filter(Boolean);

      const existingProducts = await this.prisma.product.findMany({
        where: { id: { in: validProductIds } },
        select: { id: true },
      });
      const existingIds = new Set(existingProducts.map((p) => p.id));

      const itemsToCreate = itemDtos
        .filter((d) => d.productId && existingIds.has(d.productId))
        .map((d, idx) => ({
          sectionId: section.id,
          productId: d.productId,
          sortOrder: d.sortOrder ?? idx,
        }));

      if (itemsToCreate.length > 0) {
        await this.prisma.homepageSectionItem.createMany({
          data: itemsToCreate,
        });
      }
    }

    return this.findOneAdmin(slug);
  }

  async findAllPublic(): Promise<HomeSectionPublic[]> {
    const sections = await this.prisma.homepageSection.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
          take: 20,
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                basePrice: true,
                oldPrice: true,
                unit: true,
                shortDescription: true,
                badge: true,
                status: true,
                images: {
                  where: { product: { status: 'ACTIVE' } } as any,
                  orderBy: [{ isThumbnail: 'desc' }, { sortOrder: 'asc' }],
                  take: 1,
                  select: { imageUrl: true },
                },
              },
            },
          },
        },
      },
    });

    return sections.map((section) => ({
      slug: section.slug,
      title: section.title,
      subtitle: section.subtitle ?? undefined,
      description: section.description ?? undefined,
      ctaText: section.ctaText ?? undefined,
      ctaUrl: section.ctaUrl ?? undefined,
      enabled: section.enabled,
      maxItems: section.maxItems,
      products: section.items
        .filter((item) => item.product.status === 'ACTIVE')
        .slice(0, section.maxItems)
        .map((item) => ({
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          basePrice: Number(item.product.basePrice),
          oldPrice: item.product.oldPrice ? Number(item.product.oldPrice) : undefined,
          unit: item.product.unit,
          shortDescription: item.product.shortDescription ?? undefined,
          badge: item.product.badge ?? undefined,
          images: item.product.images,
          status: item.product.status,
        })),
    }));
  }
}
