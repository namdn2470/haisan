import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@hsbx/db';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.profile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { orders: true } },
          orders: {
            select: { totalAmount: true },
          },
        },
      }),
      this.prisma.profile.count({ where }),
    ]);

    const customers = data.map((p: any) => ({
      ...p,
      totalOrders: p._count.orders,
      totalSpent: p.orders.reduce((sum: number, o: any) => sum + Number(o.totalAmount || 0), 0),
    }));

    return {
      data: customers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllCustomers(params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    return this.findAll({ ...params });
  }

  async findCustomer(id: string) {
    const data = await this.prisma.profile.findUnique({
      where: { id },
      include: {
        addresses: { where: { isDefault: true } },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { items: true },
        },
        _count: { select: { orders: true } },
      },
    });

    if (!data) throw new NotFoundException('Khách hàng không tồn tại');

    const totalSpent = await this.prisma.order.aggregate({
      where: { userId: id, orderStatus: 'COMPLETED' },
      _sum: { totalAmount: true },
    });

    return {
      data: {
        ...data,
        totalOrders: (data as any)._count.orders,
        totalSpent: totalSpent._sum.totalAmount || 0,
      },
    };
  }

  async getCustomerOrders(id: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: { select: { images: true } } } },
      },
    });

    return { data: orders };
  }

  async findOne(id: string) {
    const data = await this.prisma.profile.findUnique({ where: { id } });
    if (!data) throw new NotFoundException('User not found');
    return { data };
  }

  async updateStatus(id: string, status: string) {
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('Khách hàng không tồn tại');

    const data = await this.prisma.profile.update({
      where: { id },
      data: { status: status as any },
    });
    return { data };
  }

  async update(id: string, dto: any) {
    const data = await this.prisma.profile.update({ where: { id }, data: dto });
    return { data };
  }

  async remove(id: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id },
      include: { _count: { select: { orders: true } } },
    });

    if (!profile) throw new NotFoundException('Khách hàng không tồn tại');

    if (profile._count.orders > 0) {
      throw new BadRequestException(
        `Khách hàng có ${profile._count.orders} đơn hàng, không thể xóa. Vui lòng khóa tài khoản thay thế.`
      );
    }

    await this.prisma.profile.delete({ where: { id } });
    return { message: 'Đã xóa khách hàng' };
  }
}
