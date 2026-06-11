import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService, Prisma } from '@hsbx/db';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly STAFF_ROLES = ['MANAGER', 'ADMIN', 'STAFF', 'SHIPPER', 'SUPER_ADMIN'];
  private readonly PROTECTED_ROLES = ['SUPER_ADMIN', 'ADMIN'];

  async findAll(params: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, role, status, page = 1, limit = 15 } = params;
    const skip = (page - 1) * limit;

    // Use $queryRaw to bypass Prisma client enum caching issues
    let whereClause = 'WHERE p.role IN ($1, $2, $3, $4, $5)';
    const queryParams: any[] = ['MANAGER', 'ADMIN', 'STAFF', 'SHIPPER', 'SUPER_ADMIN'];
    let paramIdx = 6;

    if (role) {
      whereClause = `WHERE p.role = $${paramIdx}`;
      queryParams.push(role);
      paramIdx++;
    }

    if (status) {
      whereClause += ` AND p.status = $${paramIdx}`;
      queryParams.push(status);
      paramIdx++;
    }

    if (search) {
      whereClause += ` AND (p.full_name ILIKE $${paramIdx} OR p.phone ILIKE $${paramIdx} OR p.email ILIKE $${paramIdx})`;
      queryParams.push(`%${search}%`);
      paramIdx++;
    }

    const [data, totalResult] = await Promise.all([
      this.prisma.$queryRaw<any[]>`
        SELECT p.id, p.full_name as "fullName", p.phone, p.email, p.role, p.status,
               p.avatar_url as "avatarUrl", p.created_at as "createdAt", p.updated_at as "updatedAt"
        FROM profiles p
        WHERE p.role IN ('MANAGER','ADMIN','STAFF','SHIPPER','SUPER_ADMIN')
          ${role ? Prisma.sql`AND p.role = ${role}` : Prisma.sql``}
          ${status ? Prisma.sql`AND p.status = ${status}` : Prisma.sql``}
          ${search ? Prisma.sql`AND (p.full_name ILIKE ${`%${search}%`} OR p.phone ILIKE ${`%${search}%`} OR p.email ILIKE ${`%${search}%`})` : Prisma.sql``}
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${skip}
      `,
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM profiles p
        WHERE p.role IN ('MANAGER','ADMIN','STAFF','SHIPPER','SUPER_ADMIN')
          ${role ? Prisma.sql`AND p.role = ${role}` : Prisma.sql``}
          ${status ? Prisma.sql`AND p.status = ${status}` : Prisma.sql``}
          ${search ? Prisma.sql`AND (p.full_name ILIKE ${`%${search}%`} OR p.phone ILIKE ${`%${search}%`} OR p.email ILIKE ${`%${search}%`})` : Prisma.sql``}
      `,
    ]);

    const mapped = data.map(p => ({
      id: p.id,
      fullName: p.fullName || '',
      phone: p.phone || '',
      email: p.email || '',
      role: p.role,
      status: p.status,
      avatarUrl: p.avatarUrl || null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    const total = Number(totalResult[0]?.count ?? 0);

    return {
      data: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('Nhân viên không tồn tại');
    if (!this.STAFF_ROLES.includes(profile.role)) {
      throw new NotFoundException('Nhân viên không tồn tại');
    }
    return {
      id: profile.id,
      fullName: profile.fullName || '',
      phone: profile.phone || '',
      email: profile.email || '',
      role: profile.role,
      status: profile.status,
      avatarUrl: profile.avatarUrl || null,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  async create(dto: any) {
    if (!dto.fullName?.trim()) throw new BadRequestException('Tên nhân viên là bắt buộc');
    if (!dto.phone?.trim()) throw new BadRequestException('Số điện thoại là bắt buộc');
    if (!dto.password?.trim()) throw new BadRequestException('Mật khẩu là bắt buộc');
    if (dto.password?.length < 6) throw new BadRequestException('Mật khẩu phải có ít nhất 6 ký tự');

    const role = dto.role || 'STAFF';
    if (!this.STAFF_ROLES.includes(role)) {
      throw new BadRequestException('Vai trò không hợp lệ');
    }

    // Check duplicate phone
    if (dto.phone) {
      const existingPhone = await this.prisma.profile.findUnique({ where: { phone: dto.phone } });
      if (existingPhone) throw new ConflictException('Số điện thoại đã được sử dụng');
    }
    if (dto.email) {
      const existingEmail = await this.prisma.profile.findUnique({ where: { email: dto.email } });
      if (existingEmail) throw new ConflictException('Email đã được sử dụng');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const profile = await this.prisma.profile.create({
      data: {
        fullName: dto.fullName.trim(),
        phone: dto.phone.trim(),
        email: dto.email?.trim() || null,
        passwordHash,
        role: role as any,
        status: 'ACTIVE',
      },
    });

    return {
      id: profile.id,
      fullName: profile.fullName || '',
      phone: profile.phone || '',
      email: profile.email || '',
      role: profile.role,
      status: profile.status,
      createdAt: profile.createdAt,
    };
  }

  async update(id: string, dto: any) {
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('Nhân viên không tồn tại');
    if (!this.STAFF_ROLES.includes(profile.role)) {
      throw new NotFoundException('Nhân viên không tồn tại');
    }

    const updateData: any = {};
    if (dto.fullName !== undefined) updateData.fullName = dto.fullName.trim();
    if (dto.email !== undefined) {
      updateData.email = dto.email?.trim() || null;
    }
    if (dto.role !== undefined) {
      if (!this.STAFF_ROLES.includes(dto.role)) {
        throw new BadRequestException('Vai trò không hợp lệ');
      }
      updateData.role = dto.role;
    }
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.password?.trim()) {
      if (dto.password.length < 6) throw new BadRequestException('Mật khẩu phải có ít nhất 6 ký tự');
      updateData.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.prisma.profile.update({
      where: { id },
      data: updateData,
    });

    return {
      id: updated.id,
      fullName: updated.fullName || '',
      phone: updated.phone || '',
      email: updated.email || '',
      role: updated.role,
      status: updated.status,
      updatedAt: updated.updatedAt,
    };
  }

  async toggleStatus(id: string) {
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('Nhân viên không tồn tại');
    if (!this.STAFF_ROLES.includes(profile.role)) {
      throw new NotFoundException('Nhân viên không tồn tại');
    }

    const newStatus = profile.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    const updated = await this.prisma.profile.update({
      where: { id },
      data: { status: newStatus as any },
    });

    return {
      id: updated.id,
      status: updated.status,
      message: newStatus === 'BLOCKED' ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản',
    };
  }

  async remove(id: string) {
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('Nhân viên không tồn tại');
    if (!this.STAFF_ROLES.includes(profile.role)) {
      throw new NotFoundException('Nhân viên không tồn tại');
    }

    if (profile.role === 'SUPER_ADMIN') {
      throw new BadRequestException('Không thể xóa tài khoản SUPER_ADMIN');
    }

    if (profile.role === 'ADMIN') {
      const adminCount = await this.prisma.profile.count({
        where: { role: 'ADMIN' },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('Không thể xóa ADMIN cuối cùng');
      }
    }

    await this.prisma.profile.delete({ where: { id } });
    return { message: 'Đã xóa nhân viên' };
  }
}
