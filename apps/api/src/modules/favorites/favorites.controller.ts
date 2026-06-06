import { Controller, Get, Post, Param, Body, Req } from '@nestjs/common';
import { FavoritesService } from './favorites.service';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly service: FavoritesService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.user.sub);
  }

  @Post('toggle')
  toggle(@Req() req: any, @Body() dto: { productId: string }) {
    return this.service.toggle(req.user.sub, dto.productId);
  }

  @Get('check/:productId')
  check(@Req() req: any, @Param('productId') productId: string) {
    return this.service.check(req.user.sub, productId);
  }
}
