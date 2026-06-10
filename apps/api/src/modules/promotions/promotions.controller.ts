import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { Public } from '../../common/public.decorator';
import { ADMIN_ROLES, Roles } from '../../common/roles.decorator';
import { apiResponse } from '../../common/api-response';

@Roles(...ADMIN_ROLES)
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly service: PromotionsService) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    const result = await this.service.findAll({
      search,
      isActive: isActiveBool,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
    return apiResponse(result, 'Lấy danh sách khuyến mãi thành công');
  }

  @Public()
  @Get('code/:code')
  async findByCode(@Param('code') code: string) {
    const result = await this.service.findByCode(code);
    return apiResponse(result, 'Lấy thông tin mã khuyến mãi thành công');
  }

  @Public()
  @Post('validate')
  async validate(@Body() body: { code: string; subtotal: number }) {
    const result = await this.service.validate(body.code, body.subtotal);
    return apiResponse(result, 'Xác thực mã khuyến mãi thành công');
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.service.findOne(id);
    return apiResponse(result, 'Lấy chi tiết khuyến mãi thành công');
  }

  @Post()
  async create(@Body() dto: any) {
    const result = await this.service.create(dto);
    return apiResponse(result, 'Tạo khuyến mãi thành công');
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const result = await this.service.update(id, dto);
    return apiResponse(result, 'Cập nhật khuyến mãi thành công');
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.service.remove(id);
    return apiResponse(result, 'Xóa khuyến mãi thành công');
  }
}
