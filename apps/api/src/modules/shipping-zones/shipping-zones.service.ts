import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@hsbx/db';

@Injectable()
export class ShippingZonesService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeText(value?: string | null) {
    return (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  async findAll(params: { isActive?: boolean; search?: string }) {
    const { isActive, search } = params;
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { province: { contains: search, mode: 'insensitive' } },
        { district: { contains: search, mode: 'insensitive' } },
      ];
    }
    const data = await this.prisma.shippingZone.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    const mapped = data.map(z => ({
      ...z,
      shippingFee: Number(z.shippingFee),
      freeFromAmount: Number(z.freeFromAmount),
    }));
    return { data: mapped };
  }

  async findOne(id: string) {
    const z = await this.prisma.shippingZone.findUnique({ where: { id } });
    if (!z) throw new NotFoundException('Khu vực giao hàng không tồn tại');
    return {
      data: {
        ...z,
        shippingFee: Number(z.shippingFee),
        freeFromAmount: Number(z.freeFromAmount),
      },
    };
  }

  async quote(params: { province?: string; district?: string; subtotal?: number }) {
    const subtotal = Number(params.subtotal || 0);
    const province = this.normalizeText(params.province);
    const district = this.normalizeText(params.district);

    const zones = await this.prisma.shippingZone.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    const matchScore = (zone: (typeof zones)[number]) => {
      const zoneProvince = this.normalizeText(zone.province);
      const zoneDistrict = this.normalizeText(zone.district);
      let score = 0;
      if (zoneProvince && province && (province.includes(zoneProvince) || zoneProvince.includes(province))) score += 2;
      if (zoneDistrict && district && (district.includes(zoneDistrict) || zoneDistrict.includes(district))) score += 3;
      if (!zoneProvince) score += 1;
      if (!zoneDistrict) score += 1;
      return score;
    };

    const zone = zones
      .map((item) => ({ item, score: matchScore(item) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.item.sortOrder - b.item.sortOrder)[0]?.item;

    if (zone) {
      const baseFee = Number(zone.shippingFee);
      const freeFromAmount = Number(zone.freeFromAmount || 0);
      const shippingFee = freeFromAmount > 0 && subtotal >= freeFromAmount ? 0 : baseFee;
      return {
        data: {
          shippingFee,
          source: 'shipping_zone',
          zone: {
            id: zone.id,
            name: zone.name,
            province: zone.province,
            district: zone.district,
            freeFromAmount,
            estimatedDays: zone.estimatedDays,
          },
        },
      };
    }

    const settings = await this.prisma.storeSettings.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
    const defaultFee = Number(settings?.defaultShippingFee || 0);
    return {
      data: {
        shippingFee: defaultFee,
        source: 'store_settings',
        zone: null,
      },
    };
  }

  async create(dto: any) {
    if (!dto.name?.trim()) throw new BadRequestException('Tên khu vực là bắt buộc');

    const maxSort = await this.prisma.shippingZone.aggregate({
      _max: { sortOrder: true },
    });

    const data = await this.prisma.shippingZone.create({
      data: {
        name: dto.name.trim(),
        province: dto.province?.trim() || null,
        district: dto.district?.trim() || null,
        shippingFee: dto.shippingFee ?? 0,
        freeFromAmount: dto.freeFromAmount ?? 0,
        estimatedDays: dto.estimatedDays ?? 1,
        isActive: dto.isActive !== false,
        sortOrder: dto.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
      },
    });

    return {
      data: {
        ...data,
        shippingFee: Number(data.shippingFee),
        freeFromAmount: Number(data.freeFromAmount),
      },
    };
  }

  async update(id: string, dto: any) {
    const existing = await this.prisma.shippingZone.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Khu vực giao hàng không tồn tại');

    const data = await this.prisma.shippingZone.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.province !== undefined && { province: dto.province?.trim() || null }),
        ...(dto.district !== undefined && { district: dto.district?.trim() || null }),
        ...(dto.shippingFee !== undefined && { shippingFee: dto.shippingFee }),
        ...(dto.freeFromAmount !== undefined && { freeFromAmount: dto.freeFromAmount }),
        ...(dto.estimatedDays !== undefined && { estimatedDays: dto.estimatedDays }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });

    return {
      data: {
        ...data,
        shippingFee: Number(data.shippingFee),
        freeFromAmount: Number(data.freeFromAmount),
      },
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.shippingZone.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Khu vực giao hàng không tồn tại');
    await this.prisma.shippingZone.delete({ where: { id } });
    return { message: 'Đã xóa khu vực giao hàng' };
  }
}
