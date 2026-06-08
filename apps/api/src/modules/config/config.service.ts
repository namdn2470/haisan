import { Injectable } from '@nestjs/common';
import { PrismaService } from '@hsbx/db';

@Injectable()
export class ConfigService {
  constructor(private readonly prisma: PrismaService) {}

  // Get all configs or by group
  async getAll(group?: string) {
    const where = group ? { group } : {};
    const configs = await this.prisma.siteConfig.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
    return configs;
  }

  // Get public configs only (for website)
  async getPublic() {
    return this.prisma.siteConfig.findMany({
      where: { isPublic: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // Get a single config by key
  async getByKey(key: string) {
    return this.prisma.siteConfig.findUnique({ where: { key } });
  }

  // Set a config value (upsert)
  async set(key: string, value: string, type: string = 'string', group: string = 'general', label?: string, description?: string) {
    const existing = await this.prisma.siteConfig.findUnique({ where: { key } });
    
    if (existing) {
      return this.prisma.siteConfig.update({
        where: { key },
        data: { value, type, group, label, description },
      });
    }
    
    return this.prisma.siteConfig.create({
      data: { key, value, type, group, label, description },
    });
  }

  // Batch update configs
  async batchSet(items: { key: string; value: string; type?: string; group?: string; label?: string; description?: string }[]) {
    const results = await Promise.all(
      items.map((item) =>
        this.set(item.key, item.value, item.type || 'string', item.group || 'general', item.label, item.description)
      )
    );
    return results;
  }

  // Delete a config
  async delete(key: string) {
    return this.prisma.siteConfig.delete({ where: { key } });
  }

  // Initialize default configs
  async initializeDefaults() {
    const defaults = [
      // Topbar
      { key: 'free_shipping_threshold', value: '500000', type: 'number', group: 'topbar', label: 'Miễn phí giao hàng từ', description: 'Đơn hàng từ bao nhiêu sẽ được miễn phí giao hàng' },
      { key: 'hotline', value: '0901 234 567', type: 'string', group: 'topbar', label: 'Hotline', description: 'Số điện thoại hotline hiển thị trên website' },
      { key: 'zalo_url', value: 'https://zalo.me/yourpage', type: 'string', group: 'topbar', label: 'Zalo', description: 'Link Zalo OA' },
      { key: 'facebook_url', value: 'https://facebook.com/yourpage', type: 'string', group: 'topbar', label: 'Facebook', description: 'Link Facebook page' },

      // Homepage sections
      { key: 'home_categories_visible', value: 'true', type: 'boolean', group: 'homepage', label: 'Hiển thị danh mục', description: 'Hiển thị section danh mục trên trang chủ' },
      { key: 'home_featured_visible', value: 'true', type: 'boolean', group: 'homepage', label: 'Hiển thị sản phẩm nổi bật', description: 'Hiển thị section sản phẩm nổi bật' },
      { key: 'home_bestseller_visible', value: 'true', type: 'boolean', group: 'homepage', label: 'Hiển thị sản phẩm bán chạy', description: 'Hiển thị section sản phẩm bán chạy' },
      { key: 'home_newarrival_visible', value: 'true', type: 'boolean', group: 'homepage', label: 'Hiển thị sản phẩm mới', description: 'Hiển thị section sản phẩm mới' },
      { key: 'home_promo_visible', value: 'true', type: 'boolean', group: 'homepage', label: 'Hiển thị khuyến mãi', description: 'Hiển thị section khuyến mãi' },
      { key: 'home_testimonial_visible', value: 'true', type: 'boolean', group: 'homepage', label: 'Hiển thị đánh giá', description: 'Hiển thị section đánh giá khách hàng' },

      // Policy
      { key: 'policy_free_shipping', value: 'Miễn phí giao hàng cho đơn từ 500.000đ', type: 'string', group: 'policy', label: 'Chính sách giao hàng', description: 'Nội dung chính sách miễn phí giao hàng' },
      { key: 'policy_return', value: 'Đổi trả trong 24h nếu sản phẩm không đúng chất lượng', type: 'string', group: 'policy', label: 'Chính sách đổi trả', description: 'Nội dung chính sách đổi trả' },
      { key: 'policy_refund', value: 'Hoàn tiền 100% nếu sản phẩm không đạt yêu cầu', type: 'string', group: 'policy', label: 'Chính sách hoàn tiền', description: 'Nội dung chính sách hoàn tiền' },
      { key: 'policy_quality', value: 'Cam kết 100% hải sản tươi sống, đảm bảo chất lượng', type: 'string', group: 'policy', label: 'Cam kết chất lượng', description: 'Nội dung cam kết chất lượng' },

      // Menu
      { key: 'menu_items', value: JSON.stringify([
        { label: 'Trang chủ', url: '/', icon: 'home' },
        { label: 'Sản phẩm', url: '/products', icon: 'package' },
        { label: 'Khuyến mãi', url: '/promotions', icon: 'tag' },
        { label: 'Tin tức', url: '/posts', icon: 'newspaper' },
        { label: 'Liên hệ', url: '/contact', icon: 'phone' },
      ]), type: 'json', group: 'menu', label: 'Menu chính', description: 'Cấu hình các mục menu chính' },

      // Footer
      { key: 'footer_about', value: 'Hải Sản Biển Xanh - Chuyên cung cấp hải sản tươi sống, chất lượng cao.', type: 'string', group: 'footer', label: 'Giới thiệu', description: 'Nội dung giới thiệu footer' },
      { key: 'footer_address', value: '123 Đường Biển, Quận 1, TP.HCM', type: 'string', group: 'footer', label: 'Địa chỉ', description: 'Địa chỉ công ty' },
      { key: 'footer_email', value: 'contact@haisanbienxanh.vn', type: 'string', group: 'footer', label: 'Email', description: 'Email liên hệ' },
      { key: 'footer_working_hours', value: '7:00 - 21:00 (Thứ 2 - CN)', type: 'string', group: 'footer', label: 'Giờ làm việc', description: 'Giờ làm việc' },

      // SEO
      { key: 'seo_title', value: 'Hải Sản Biển Xanh - Hải sản tươi sống chất lượng cao', type: 'string', group: 'seo', label: 'Tiêu đề SEO', description: 'Tiêu đề mặc định cho website' },
      { key: 'seo_description', value: 'Chuyên cung cấp các loại hải sản tươi sống: tôm, cá, mực, cua... Cam kết chất lượng, giao hàng nhanh.', type: 'string', group: 'seo', label: 'Mô tả SEO', description: 'Mô tả mặc định cho website' },
      { key: 'seo_keywords', value: 'hải sản, tôm, cá, mực, cua, hải sản tươi, seafood', type: 'string', group: 'seo', label: 'Từ khóa SEO', description: 'Từ khóa mặc định cho website' },
    ];

    for (const item of defaults) {
      const existing = await this.prisma.siteConfig.findUnique({ where: { key: item.key } });
      if (!existing) {
        await this.prisma.siteConfig.create({ data: item });
      }
    }

    return { message: 'Default configs initialized' };
  }
}
