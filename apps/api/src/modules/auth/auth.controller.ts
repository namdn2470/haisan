import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../../common/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: { phone: string; password: string; full_name?: string }) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: { phone: string; password: string }) {
    return this.auth.login(dto);
  }
}
