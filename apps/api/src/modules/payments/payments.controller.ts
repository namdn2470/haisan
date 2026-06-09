import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ADMIN_ROLES, Roles } from '../../common/roles.decorator';
import { apiResponse } from '../../common/api-response';

@Roles(...ADMIN_ROLES)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Get()
  async findAll(@Query('orderId') orderId?: string) {
    const result = await this.service.findAll(orderId);
    return apiResponse(result, 'Lấy danh sách thanh toán thành công');
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.service.findOne(id);
    return apiResponse(result, 'Lấy chi tiết thanh toán thành công');
  }

  @Post()
  async create(@Body() dto: any) {
    const result = await this.service.create(dto);
    return apiResponse(result, 'Tạo thanh toán thành công');
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() dto: { status: string }) {
    const result = await this.service.updateStatus(id, dto.status);
    return apiResponse(result, 'Cập nhật trạng thái thanh toán thành công');
  }
}
