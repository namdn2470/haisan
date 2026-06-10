import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@hsbx/db';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeSort(sort?: string) {
    if (sort === 'price-asc' || sort === 'price_asc') return 'price-asc';
    if (sort === 'price-desc' || sort === 'price_desc') return 'price-desc';
    if (sort === 'newest' || sort === 'new') return 'newest';
    return 'best-selling';
  }

  async findAll(filters: {
    category?: string;
    search?: string;
    status?: string;
    lowStock?: boolean;
    sort?: string;
    page?: number;
    limit?: number;
    bestSeller?: boolean;
    featured?: boolean;
    all?: boolean;
    publicOnly?: boolean;
  }) {
    const where: any = {};

    if (filters.publicOnly) {
      where.status = 'ACTIVE';
      where.inventory = { some: { quantity: { gt: 0 } } };
    } else if (!filters.all) {
      if (filters.status) {
        where.status = filters.status;
      } else {
        where.status = 'ACTIVE';
      }
    }

    if (filters.category) {
      where.category = { slug: filters.category };
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { slug: { contains: filters.search, mode: 'insensitive' } },
        { shortDescription: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.bestSeller) {
      where.isBestSeller = true;
    }

    if (filters.featured) {
      where.isFeatured = true;
    }

    if (filters.lowStock) {
      where.inventory = {
        some: {
          quantity: { lte: 10 },
        },
      };
    }

    const orderBy: any = {};
    const sort = this.normalizeSort(filters.sort);
    if (sort === 'price-asc') orderBy.basePrice = 'asc';
    else if (sort === 'price-desc') orderBy.basePrice = 'desc';
    else if (sort === 'newest') orderBy.createdAt = 'desc';
    else orderBy.soldCount = 'desc';

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: true,
          inventory: true,
          images: {
            orderBy: [{ isThumbnail: 'desc' }, { sortOrder: 'asc' }],
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findBySlug(slug: string, publicOnly = false) {
    const data = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        variants: { where: { isActive: true }, orderBy: { price: 'asc' } },
        inventory: true,
        images: { orderBy: { sortOrder: 'asc' } },
        processingOptions: { include: { processingService: true } },
        category: true,
        reviews: {
          where: { status: 'APPROVED' },
          include: { user: { select: { fullName: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!data) throw new NotFoundException('Product not found');
    if (publicOnly && data.status !== 'ACTIVE') throw new NotFoundException('Product not found');
    return { data };
  }

  async findOne(id: string) {
    const data = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        inventory: true,
        variants: { orderBy: { price: 'asc' } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!data) throw new NotFoundException('Product not found');
    return { data };
  }

  async findAllForAdmin(filters: {
    category?: string;
    search?: string;
    status?: string;
    lowStock?: boolean;
    sort?: string;
    page?: number;
    limit?: number;
    bestSeller?: boolean;
  }) {
    return this.findAll({ ...filters, all: true });
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

  private productData(dto: any, partial = false) {
    const data: any = {};
    const set = (key: string, value: unknown) => {
      if (!partial || value !== undefined) data[key] = value;
    };

    set('categoryId', dto.categoryId ?? dto.category_id);
    set('name', dto.name);
    set('slug', dto.slug ?? (dto.name ? this.slugify(dto.name) : undefined));
    set('shortDescription', dto.shortDescription ?? dto.short_description ?? (partial ? undefined : null));
    set('description', dto.description ?? dto.shortDescription ?? dto.short_description ?? (partial ? undefined : null));
    set('origin', dto.origin ?? (partial ? undefined : null));
    set('storageInstruction', dto.storageInstruction ?? dto.storage_instruction ?? (partial ? undefined : null));
    set('unit', dto.unit ?? (partial ? undefined : 'KG'));
    const basePrice = dto.basePrice ?? dto.base_price;
    const oldPrice = dto.oldPrice ?? dto.old_price;
    set('basePrice', basePrice !== undefined ? Number(basePrice) : partial ? undefined : 0);
    set('oldPrice', oldPrice !== undefined && oldPrice !== null && oldPrice !== '' ? Number(oldPrice) : partial ? undefined : null);
    set('status', dto.status ?? (partial ? undefined : 'ACTIVE'));
    set('badge', dto.badge ?? (partial ? undefined : null));
    set('isFeatured', dto.isFeatured ?? dto.is_featured ?? (partial ? undefined : false));
    set('isBestSeller', dto.isBestSeller ?? dto.is_best_seller ?? (partial ? undefined : false));
    set('isFreshLive', dto.isFreshLive ?? dto.is_fresh_live ?? (partial ? undefined : true));

    return data;
  }

  async create(dto: any) {
    if (!dto.name) {
      throw new BadRequestException('Tên sản phẩm là bắt buộc');
    }

    const slug = dto.slug || this.slugify(dto.name);
    const existing = await this.prisma.product.findUnique({ where: { slug } });
    if (existing) {
      throw new BadRequestException('Slug đã tồn tại, vui lòng chọn slug khác');
    }

    const images = dto.images || [];
    const imageUrl = dto.imageUrl || dto.image_url || images.find((i: any) => i.isThumbnail)?.imageUrl || images[0]?.imageUrl;

    const stockQty = dto.stockQuantity ?? dto.stock_quantity;
    const lowStock = dto.lowStockThreshold ?? dto.low_stock_threshold;

    const data = await this.prisma.product.create({
      data: {
        ...this.productData(dto),
        images: imageUrl ? {
          create: images.length > 0 ? images.map((img: any, idx: number) => ({
            imageUrl: img.imageUrl,
            altText: img.altText || dto.name,
            isThumbnail: img.isThumbnail ?? idx === 0,
            sortOrder: idx + 1,
          })) : [{
            imageUrl,
            altText: dto.name,
            isThumbnail: true,
            sortOrder: 1,
          }]
        } : undefined,
        inventory: {
          create: {
            quantity: stockQty !== undefined ? Number(stockQty) : 0,
            lowStockThreshold: lowStock !== undefined ? Number(lowStock) : 5,
          },
        },
      },
      include: { category: true, images: true, variants: true, inventory: true },
    });
    return { data };
  }

  async update(id: string, dto: any) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    if (dto.slug && dto.slug !== product.slug) {
      const existing = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
      if (existing) {
        throw new BadRequestException('Slug đã tồn tại, vui lòng chọn slug khác');
      }
    }

    const productData = this.productData(dto, true);

    const data = await this.prisma.product.update({
      where: { id },
      data: productData,
      include: { category: true, images: { orderBy: { sortOrder: 'asc' } }, variants: true, inventory: true },
    });

    const stockQty = dto.stockQuantity ?? dto.stock_quantity;
    const lowStock = dto.lowStockThreshold ?? dto.low_stock_threshold;
    if (stockQty !== undefined || lowStock !== undefined) {
      const existingInv = await this.prisma.inventory.findFirst({ where: { productId: id, variantId: null } });
      const inventoryData: any = {};
      if (stockQty !== undefined) inventoryData.quantity = Number(stockQty);
      if (lowStock !== undefined) inventoryData.lowStockThreshold = Number(lowStock);
      if (existingInv) {
        await this.prisma.inventory.update({ where: { id: existingInv.id }, data: inventoryData });
      } else {
        await this.prisma.inventory.create({ data: { productId: id, ...inventoryData } });
      }
    }

    if (dto.images && Array.isArray(dto.images)) {
      await this.prisma.productImage.deleteMany({ where: { productId: id } });
      await this.prisma.productImage.createMany({
        data: dto.images.map((img: any, idx: number) => ({
          productId: id,
          imageUrl: img.imageUrl,
          altText: img.altText || dto.name || data.name,
          isThumbnail: img.isThumbnail ?? idx === 0,
          sortOrder: img.sortOrder ?? idx + 1,
        })),
      });
    }

    return this.findOne(id);
  }

  async updateImages(id: string, images: Array<{ imageUrl: string; isThumbnail?: boolean }>) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    await this.prisma.productImage.deleteMany({ where: { productId: id } });
    await this.prisma.productImage.createMany({
      data: images.map((img, idx) => ({
        productId: id,
        imageUrl: img.imageUrl,
        altText: product.name,
        isThumbnail: img.isThumbnail ?? idx === 0,
      })),
    });

    return this.findOne(id);
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        orderItems: { select: { id: true, quantity: true } },
      },
    });

    if (!product) throw new NotFoundException('Product not found');

    if (product.orderItems && product.orderItems.length > 0) {
      await this.prisma.product.update({
        where: { id },
        data: { status: 'INACTIVE' },
      });
      return {
        message: 'Sản phẩm đã có trong đơn hàng nên được chuyển sang trạng thái ẩn thay vì xóa',
        softDeleted: true,
      };
    }

    await this.prisma.product.delete({ where: { id } });
    return { message: 'Đã xóa sản phẩm', softDeleted: false };
  }
}
