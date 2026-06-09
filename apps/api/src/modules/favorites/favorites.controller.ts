import { Controller, Get, Post, Param, Body, Req } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { apiResponse } from '../../common/api-response';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly service: FavoritesService) {}

  @Get()
  async findAll(@Req() req: any) {
    const result = await this.service.findAll(req.user.sub);
    return apiResponse(result, 'Lấy danh sách yêu thích thành công');
  }

  @Post('toggle')
  async toggle(@Req() req: any, @Body() dto: { productId: string }) {
    const result = await this.service.toggle(req.user.sub, dto.productId);
    return apiResponse(result, 'Cập nhật yêu thích thành công');
  }

  @Get('check/:productId')
  async check(@Req() req: any, @Param('productId') productId: string) {
    const result = await this.service.check(req.user.sub, productId);
    return apiResponse(result, 'Kiểm tra yêu thích thành công');
  }
}
