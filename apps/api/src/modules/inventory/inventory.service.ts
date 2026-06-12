import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@hsbx/db';
import { RealtimeService } from '../../realtime/realtime.service';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  async findAll(params: {
    productId?: string;
    lowStock?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { productId, lowStock, search, page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (productId) where.productId = productId;
    if (search) {
      where.OR = [
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { variant: { sku: { contains: search, mode: 'insensitive' } } },
        { product: { id: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              unit: true,
              images: { where: { isThumbnail: true }, take: 1 },
            },
          },
          variant: {
            select: { id: true, name: true, sku: true, unit: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.inventory.count({ where }),
    ]);

    const mapped = data.map(inv => {
      const qty = Number(inv.quantity);
      const reserved = Number(inv.reservedQuantity);
      const threshold = Number(inv.lowStockThreshold);
      const available = qty - reserved;
      let status = 'IN_STOCK';
      if (qty === 0) status = 'OUT_OF_STOCK';
      else if (available <= threshold) status = 'LOW_STOCK';

      return {
        id: inv.id,
        productId: inv.productId,
        productName: inv.product?.name || '',
        productImage: inv.product?.images?.[0]?.imageUrl || null,
        sku: inv.variant?.sku || `PROD-${inv.productId.slice(0, 8).toUpperCase()}`,
        variant: inv.variant?.name || null,
        unit: inv.variant?.unit || inv.product?.unit || 'KG',
        stockQuantity: qty,
        reservedQuantity: reserved,
        availableQuantity: available,
        lowStockThreshold: threshold,
        status,
        updatedAt: inv.updatedAt,
      };
    });

    let filtered = mapped;
    if (lowStock) {
      filtered = mapped.filter(item => item.status !== 'IN_STOCK');
    }

    return {
      data: filtered,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const inv = await this.prisma.inventory.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            unit: true,
            images: { where: { isThumbnail: true }, take: 1 },
          },
        },
        variant: {
          select: { id: true, name: true, sku: true, unit: true },
        },
      },
    });

    if (!inv) throw new NotFoundException('Không tìm thấy bản ghi tồn kho');

    const qty = Number(inv.quantity);
    const reserved = Number(inv.reservedQuantity);
    const threshold = Number(inv.lowStockThreshold);
    const available = qty - reserved;
    let status = 'IN_STOCK';
    if (qty === 0) status = 'OUT_OF_STOCK';
    else if (available <= threshold) status = 'LOW_STOCK';

    return {
      id: inv.id,
      productId: inv.productId,
      productName: inv.product?.name || '',
      productImage: inv.product?.images?.[0]?.imageUrl || null,
      sku: inv.variant?.sku || `PROD-${inv.productId.slice(0, 8).toUpperCase()}`,
      variant: inv.variant?.name || null,
      unit: inv.variant?.unit || inv.product?.unit || 'KG',
      stockQuantity: qty,
      reservedQuantity: reserved,
      availableQuantity: available,
      lowStockThreshold: threshold,
      status,
      updatedAt: inv.updatedAt,
    };
  }

  async adjustStock(params: {
    type: 'IMPORT' | 'EXPORT' | 'ADJUSTMENT';
    productId: string;
    variantId?: string;
    quantity?: number;
    newQuantity?: number;
    note?: string;
    createdBy?: string;
  }) {
    const { type, productId, variantId, quantity, newQuantity, note, createdBy } = params;

    if (!productId) throw new BadRequestException('productId là bắt buộc');

    const inventory = await this.prisma.inventory.findFirst({
      where: { productId, ...(variantId ? { variantId } : {}) },
    });

    if (!inventory) {
      const created = await this.prisma.inventory.create({
        data: {
          productId,
          variantId: variantId || null,
          quantity: type === 'IMPORT' ? (quantity || 0) : 0,
          reservedQuantity: 0,
          lowStockThreshold: 5,
        },
      });

      if (type === 'IMPORT' || type === 'ADJUSTMENT') {
        await this.prisma.inventoryLog.create({
          data: {
            productId,
            variantId: variantId || null,
            type,
            quantity: type === 'IMPORT' ? (quantity || 0) : 0,
            oldQuantity: 0,
            newQuantity: type === 'IMPORT' ? Number(created.quantity) : (newQuantity || 0),
            note,
            createdBy,
          },
        });
      }

      return {
        message: type === 'IMPORT' ? 'Đã nhập kho' : type === 'EXPORT' ? 'Đã xuất kho' : 'Đã điều chỉnh',
        inventory: {
          id: created.id,
          quantity: Number(created.quantity),
        },
      };
    }

    const oldQty = Number(inventory.quantity);
    let updatedQty = oldQty;

    if (type === 'IMPORT') {
      updatedQty = oldQty + (quantity || 0);
    } else if (type === 'EXPORT') {
      updatedQty = Math.max(0, oldQty - (quantity || 0));
    } else if (type === 'ADJUSTMENT') {
      updatedQty = newQuantity ?? oldQty;
    }

    const updated = await this.prisma.inventory.update({
      where: { id: inventory.id },
      data: { quantity: updatedQty },
    });

    await this.prisma.inventoryLog.create({
      data: {
        productId,
        variantId: variantId || null,
        type,
        quantity: type === 'IMPORT' ? (quantity || 0) : type === 'EXPORT' ? (quantity || 0) : Math.abs(updatedQty - oldQty),
        oldQuantity: oldQty,
        newQuantity: updatedQty,
        note,
        createdBy,
      },
    });

    const threshold = inventory.lowStockThreshold != null ? Number(inventory.lowStockThreshold) : 5;
    if (oldQty > threshold && updatedQty <= threshold) {
      const product = await this.prisma.product.findUnique({ where: { id: productId }, select: { name: true } });
      const notification = await this.prisma.notification.create({
        data: {
          type: 'PRODUCT_LOW_STOCK',
          title: 'Sản phẩm sắp hết hàng',
          message: `Sản phẩm ${product?.name || 'không xác định'} chỉ còn ${updatedQty}`,
          data: { productId, inventoryId: inventory.id, quantity: updatedQty },
        },
      });
      const productName = product?.name || 'Không xác định';
      const payload = {
        productId,
        productName,
        quantity: updatedQty,
        threshold,
        inventoryId: inventory.id,
      };
      this.realtime.emitInventoryLowStock(payload);
      this.realtime.emitNotificationNew(this.realtime.createPayload({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        createdAt: notification.createdAt.toISOString(),
      }));
    }

    return {
      message: type === 'IMPORT' ? 'Đã nhập kho' : type === 'EXPORT' ? 'Đã xuất kho' : 'Đã điều chỉnh',
      inventory: {
        id: updated.id,
        quantity: Number(updated.quantity),
      },
    };
  }

  async findLogs(params: {
    productId?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const { productId, type, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (productId) where.productId = productId;
    if (type) where.type = type;

    const [data, total] = await Promise.all([
      this.prisma.inventoryLog.findMany({
        where,
        include: {
          product: { select: { id: true, name: true } },
          variant: { select: { id: true, name: true, sku: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.inventoryLog.count({ where }),
    ]);

    const mapped = data.map(log => ({
      id: log.id,
      productId: log.productId,
      productName: log.product?.name || '',
      variantName: log.variant?.name || null,
      variantSku: log.variant?.sku || null,
      type: log.type,
      quantity: Number(log.quantity),
      oldQuantity: Number(log.oldQuantity),
      newQuantity: Number(log.newQuantity),
      note: log.note,
      createdBy: log.createdBy,
      createdAt: log.createdAt,
    }));

    return {
      data: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateThreshold(id: string, lowStockThreshold: number) {
    const existing = await this.prisma.inventory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Không tìm thấy bản ghi tồn kho');

    const updated = await this.prisma.inventory.update({
      where: { id },
      data: { lowStockThreshold },
    });

    return {
      message: 'Đã cập nhật ngưỡng cảnh báo',
      lowStockThreshold: Number(updated.lowStockThreshold),
    };
  }
}
