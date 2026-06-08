import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../../common/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: { phone: string; password: string; fullName?: string }) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: { phone: string; password: string }) {
    return this.auth.login(dto);
  }

  @Get('me')
  me(@Req() req: any) {
    return this.auth.me(req.user.sub);
  }
}
