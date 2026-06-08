import { Injectable } from '@nestjs/common';
import { PrismaService } from '@hsbx/db';

export const ALL_PERMISSIONS = [
  // Dashboard
  { key: 'dashboard.view', label: 'Xem dashboard', category: 'Dashboard' },
  // Orders
  { key: 'orders.view', label: 'Xem đơn hàng', category: 'Orders' },
  { key: 'orders.update', label: 'Cập nhật đơn hàng', category: 'Orders' },
  { key: 'orders.cancel', label: 'Hủy đơn hàng', category: 'Orders' },
  // Products
  { key: 'products.view', label: 'Xem sản phẩm', category: 'Products' },
  { key: 'products.create', label: 'Thêm sản phẩm', category: 'Products' },
  { key: 'products.update', label: 'Sửa sản phẩm', category: 'Products' },
  { key: 'products.delete', label: 'Xóa sản phẩm', category: 'Products' },
  // Categories
  { key: 'categories.view', label: 'Xem danh mục', category: 'Categories' },
  { key: 'categories.create', label: 'Thêm danh mục', category: 'Categories' },
  { key: 'categories.update', label: 'Sửa danh mục', category: 'Categories' },
  { key: 'categories.delete', label: 'Xóa danh mục', category: 'Categories' },
  // Customers
  { key: 'customers.view', label: 'Xem khách hàng', category: 'Customers' },
  { key: 'customers.update', label: 'Cập nhật khách hàng', category: 'Customers' },
  // Promotions
  { key: 'promotions.view', label: 'Xem khuyến mãi', category: 'Promotions' },
  { key: 'promotions.create', label: 'Thêm khuyến mãi', category: 'Promotions' },
  { key: 'promotions.update', label: 'Sửa khuyến mãi', category: 'Promotions' },
  { key: 'promotions.delete', label: 'Xóa khuyến mãi', category: 'Promotions' },
  // Posts
  { key: 'posts.view', label: 'Xem bài viết', category: 'Posts' },
  { key: 'posts.create', label: 'Thêm bài viết', category: 'Posts' },
  { key: 'posts.update', label: 'Sửa bài viết', category: 'Posts' },
  { key: 'posts.delete', label: 'Xóa bài viết', category: 'Posts' },
  // Banners
  { key: 'banners.view', label: 'Xem banner', category: 'Banners' },
  { key: 'banners.create', label: 'Thêm banner', category: 'Banners' },
  { key: 'banners.update', label: 'Sửa banner', category: 'Banners' },
  { key: 'banners.delete', label: 'Xóa banner', category: 'Banners' },
  // Reviews
  { key: 'reviews.view', label: 'Xem đánh giá', category: 'Reviews' },
  { key: 'reviews.update', label: 'Duyệt/Ẩn đánh giá', category: 'Reviews' },
  // Delivery
  { key: 'delivery.view', label: 'Xem giao hàng', category: 'Delivery' },
  { key: 'delivery.update', label: 'Cập nhật giao hàng', category: 'Delivery' },
  // Inventory
  { key: 'inventory.view', label: 'Xem kho hàng', category: 'Inventory' },
  { key: 'inventory.update', label: 'Cập nhật kho hàng', category: 'Inventory' },
  // Staff
  { key: 'staff.view', label: 'Xem nhân viên', category: 'Staff' },
  { key: 'staff.create', label: 'Thêm nhân viên', category: 'Staff' },
  { key: 'staff.update', label: 'Sửa nhân viên', category: 'Staff' },
  { key: 'staff.delete', label: 'Xóa nhân viên', category: 'Staff' },
  // Reports
  { key: 'reports.view', label: 'Xem báo cáo', category: 'Reports' },
  // Settings
  { key: 'settings.view', label: 'Xem cài đặt', category: 'Settings' },
  { key: 'settings.update', label: 'Cập nhật cài đặt', category: 'Settings' },
];

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { search?: string; isActive?: string }) {
    const where: any = {};

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { slug: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.isActive !== undefined) {
      where.isActive = params.isActive === 'true';
    }

    const roles = await this.prisma.customRole.findMany({
      where,
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      include: {
        _count: { select: { profiles: true } },
      },
    });

    return roles.map(r => ({
      ...r,
      permissions: r.permissions as string[],
      staffCount: (r as any)._count?.profiles ?? 0,
    }));
  }

  async findOne(id: string) {
    const role = await this.prisma.customRole.findUnique({
      where: { id },
      include: {
        _count: { select: { profiles: true } },
      },
    });

    if (!role) return null;

    return {
      ...role,
      permissions: role.permissions as string[],
      staffCount: (role as any)._count?.profiles ?? 0,
    };
  }

  async create(data: { name: string; slug: string; description?: string; color?: string; permissions?: string[] }) {
    // Check if slug already exists
    const existing = await this.prisma.customRole.findUnique({ where: { slug: data.slug } });
    if (existing) {
      throw new Error('Slug đã tồn tại');
    }

    const role = await this.prisma.customRole.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        color: data.color || '#64748b',
        permissions: data.permissions || [],
        isActive: true,
        isSystem: false,
      },
    });

    return { ...role, permissions: role.permissions as string[] };
  }

  async update(id: string, data: { name?: string; description?: string; color?: string; permissions?: string[]; isActive?: boolean }) {
    const existing = await this.prisma.customRole.findUnique({ where: { id } });
    if (!existing) return null;

    // System roles cannot be deactivated
    if (existing.isSystem && data.isActive === false) {
      throw new Error('Không thể vô hiệu hóa vai trò hệ thống');
    }

    const role = await this.prisma.customRole.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.permissions !== undefined && { permissions: data.permissions }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return { ...role, permissions: role.permissions as string[] };
  }

  async remove(id: string) {
    const existing = await this.prisma.customRole.findUnique({
      where: { id },
      include: { _count: { select: { profiles: true } } },
    });

    if (!existing) return null;

    if (existing.isSystem) {
      throw new Error('Không thể xóa vai trò hệ thống');
    }

    if ((existing as any)._count?.profiles > 0) {
      throw new Error('Vai trò đang được sử dụng bởi nhân viên');
    }

    await this.prisma.customRole.delete({ where: { id } });
    return { message: 'Xóa vai trò thành công' };
  }

  getAllPermissions() {
    return ALL_PERMISSIONS;
  }
}
