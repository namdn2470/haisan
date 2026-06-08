import { Injectable } from '@nestjs/common';
import { PrismaService } from '@hsbx/db';
import { Prisma } from '@hsbx/db';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

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

  async updateSettings(data: Prisma.StoreSettingsUpdateInput) {
    const settings = await this.prisma.storeSettings.findFirst();

    if (!settings) {
      return this.prisma.storeSettings.create({
        data: {
          ...data,
          isActive: true,
        } as Prisma.StoreSettingsCreateInput,
      });
    }

    return this.prisma.storeSettings.update({
      where: { id: settings.id },
      data,
    });
  }

  async getPublicSettings() {
    const settings = await this.prisma.storeSettings.findFirst({
      where: { isActive: true },
      select: {
        storeName: true,
        logo: true,
        favicon: true,
        hotline: true,
        email: true,
        address: true,
        openingHours: true,
        facebookUrl: true,
        zaloUrl: true,
        tiktokUrl: true,
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
