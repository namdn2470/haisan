import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { ADMIN_ROLES, Roles } from '../../common/roles.decorator';
import { apiResponse } from '../../common/api-response';

@Roles(...ADMIN_ROLES)
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly service: DeliveryService) {}

  @Get()
  async findAll(@Query('orderId') orderId?: string) {
    const result = await this.service.findAll(orderId);
    return apiResponse(result, 'Lấy danh sách giao hàng thành công');
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.service.findOne(id);
    return apiResponse(result, 'Lấy chi tiết giao hàng thành công');
  }

  @Post()
  async create(@Body() dto: any) {
    const result = await this.service.create(dto);
    return apiResponse(result, 'Tạo giao hàng thành công');
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() dto: { status: string }) {
    const result = await this.service.updateStatus(id, dto.status);
    return apiResponse(result, 'Cập nhật trạng thái giao hàng thành công');
  }
}
