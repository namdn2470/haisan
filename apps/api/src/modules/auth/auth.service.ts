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

  async register(dto: { phone: string; password: string; full_name?: string }) {
    const existing = await this.prisma.profile.findUnique({ where: { phone: dto.phone } });
    if (existing) throw new ConflictException('Phone already registered');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.profile.create({
      data: {
        phone: dto.phone,
        passwordHash: hashed,
        fullName: dto.full_name || '',
      },
    });

    const token = this.jwt.sign({ sub: user.id, role: user.role });
    return { data: { token, user: { id: user.id, phone: user.phone, fullName: user.fullName, role: user.role } } };
  }

  async login(dto: { phone: string; password: string }) {
    const user = await this.prisma.profile.findUnique({ where: { phone: dto.phone } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash || '');
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwt.sign({ sub: user.id, role: user.role });
    return { data: { token, user: { id: user.id, phone: user.phone, fullName: user.fullName, role: user.role } } };
  }
}
