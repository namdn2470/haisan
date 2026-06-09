import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../../common/public.decorator';
import { apiResponse } from '../../common/api-response';

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
    const result = this.auth.me(req.user.sub);
    return apiResponse(result, 'Lấy thông tin người dùng thành công');
  }
}
