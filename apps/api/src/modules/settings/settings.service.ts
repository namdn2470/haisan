import { Injectable } from '@nestjs/common';
import { PrismaService } from '@hsbx/db';
import { Prisma } from '@hsbx/db';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  private emptyToNull(value: string | null | undefined): string | null {
    if (value === '' || value === undefined) return null;
    return value;
  }

  async getSettings() {
    let settings = await this.prisma.storeSettings.findFirst();

    if (!settings) {
      settings = await this.prisma.storeSettings.create({
        data: {
          storeName: 'Hải Sản Biển Xanh',
          isActive: true,
        },
      });
    }

    return settings;
  }

  async updateSettings(data: Partial<Prisma.StoreSettingsUpdateInput>) {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (value === '' || value === undefined) {
        sanitized[key] = null;
      } else {
        sanitized[key] = value;
      }
    }

    let settings = await this.prisma.storeSettings.findFirst();

    if (!settings) {
      return this.prisma.storeSettings.create({
        data: {
          storeName: (sanitized.storeName as string) || 'Hải Sản Biển Xanh',
          ...sanitized,
          isActive: true,
        } as Prisma.StoreSettingsCreateInput,
      });
    }

    return this.prisma.storeSettings.update({
      where: { id: settings.id },
      data: sanitized,
    });
  }

  async getPublicSettings() {
    const settings = await this.prisma.storeSettings.findFirst({
      where: { isActive: true },
      select: {
        storeName: true,
        storeDescription: true,
        logo: true,
        favicon: true,
        phone: true,
        hotline: true,
        email: true,
        address: true,
        ward: true,
        district: true,
        city: true,
        mapUrl: true,
        openingHours: true,
        deliveryPolicy: true,
        returnPolicy: true,
        facebookUrl: true,
        zaloUrl: true,
        tiktokUrl: true,
        youtubeUrl: true,
        instagramUrl: true,
        defaultShippingFee: true,
        defaultShippingZone: true,
        seoTitle: true,
        seoDescription: true,
        seoKeywords: true,
        ogImage: true,
      },
    });

    return settings;
  }
}
