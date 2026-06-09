import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ShippingZonesService } from './shipping-zones.service';
import { ADMIN_ROLES, Roles } from '../../common/roles.decorator';
import { Public } from '../../common/public.decorator';
import { apiResponse } from '../../common/api-response';

@Roles(...ADMIN_ROLES)
@Controller('shipping-zones')
export class ShippingZonesController {
  constructor(private readonly service: ShippingZonesService) {}

  @Get()
  async findAll(
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    const result = await this.service.findAll({ isActive: isActiveBool, search });
    return apiResponse(result, 'Lấy danh sách khu vực giao hàng thành công');
  }

  @Public()
  @Get('quote')
  async quote(
    @Query('province') province?: string,
    @Query('district') district?: string,
    @Query('subtotal') subtotal?: string,
  ) {
    const result = await this.service.quote({
      province,
      district,
      subtotal: subtotal ? Number(subtotal) : 0,
    });
    return apiResponse(result, 'Lấy báo giá giao hàng thành công');
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.service.findOne(id);
    return apiResponse(result, 'Lấy chi tiết khu vực giao hàng thành công');
  }

  @Post()
  async create(@Body() dto: any) {
    const result = await this.service.create(dto);
    return apiResponse(result, 'Tạo khu vực giao hàng thành công');
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const result = await this.service.update(id, dto);
    return apiResponse(result, 'Cập nhật khu vực giao hàng thành công');
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.service.remove(id);
    return apiResponse(result, 'Xóa khu vực giao hàng thành công');
  }
}
