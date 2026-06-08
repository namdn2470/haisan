import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@hsbx/db';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private normalizePhone(phone?: string) {
    return String(phone || '').replace(/[^\d+]/g, '');
  }

  async register(dto: { phone: string; password: string; fullName?: string }) {
    const phone = this.normalizePhone(dto.phone);
    const existing = await this.prisma.profile.findUnique({ where: { phone } });
    if (existing) throw new ConflictException('Số điện thoại đã được đăng ký');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.profile.create({
      data: {
        phone,
        passwordHash: hashed,
        fullName: dto.fullName?.trim() || '',
      },
    });

    const token = this.jwt.sign({ sub: user.id, role: user.role });
    return { data: { token, user: { id: user.id, phone: user.phone, fullName: user.fullName, role: user.role } } };
  }

  async login(dto: { phone: string; password: string }) {
    const phone = this.normalizePhone(dto.phone);
    const user = await this.prisma.profile.findFirst({
      where: {
        OR: [
          { phone },
          { phone: dto.phone },
        ],
      },
    });
    if (!user) throw new UnauthorizedException('Số điện thoại hoặc mật khẩu không đúng');

    const valid = await bcrypt.compare(dto.password, user.passwordHash || '');
    if (!valid) throw new UnauthorizedException('Số điện thoại hoặc mật khẩu không đúng');

    const token = this.jwt.sign({ sub: user.id, role: user.role });
    return { data: { token, user: { id: user.id, phone: user.phone, fullName: user.fullName, role: user.role } } };
  }

  async me(id: string) {
    const user = await this.prisma.profile.findUnique({ where: { id } });
    if (!user) throw new UnauthorizedException('Invalid token');
    return {
      data: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
      },
    };
  }
}
