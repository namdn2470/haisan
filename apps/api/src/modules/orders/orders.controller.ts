import { Controller, Get, Post, Put, Param, Body, Query, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Public } from '../../common/public.decorator';
import { ADMIN_ROLES, Roles } from '../../common/roles.decorator';
import { apiResponse } from '../../common/api-response';

@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Get()
  async findAll(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user?.sub;
    const result = await this.service.findAll(userId, req.user?.role, {
      search,
      status,
      paymentStatus,
      startDate,
      endDate,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
    return apiResponse(result, 'Lấy danh sách đơn hàng thành công');
  }

  @Public()
  @Get('my')
  async findMy(
    @Query('orderCode') orderCode?: string,
  ) {
    const result = await this.service.findByOrderCode(orderCode);
    return apiResponse(result, 'Lấy đơn hàng thành công');
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const result = await this.service.findOne(id, req.user?.sub, req.user?.role);
    return apiResponse(result, 'Lấy chi tiết đơn hàng thành công');
  }

  @Public()
  @Post()
  async create(@Req() req: any, @Body() dto: any) {
    const userId = req.user?.sub;
    const result = await this.service.create(userId, dto);
    return apiResponse(result, 'Tạo đơn hàng thành công');
  }

  @Roles(...ADMIN_ROLES)
  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: { status: string; note?: string; actorName?: string },
  ) {
    const result = await this.service.updateStatus(id, dto.status, dto.note, dto.actorName);
    return apiResponse(result, 'Cập nhật trạng thái thành công');
  }

  @Roles(...ADMIN_ROLES)
  @Put(':id/note')
  async updateNote(@Param('id') id: string, @Body() dto: { note: string }) {
    const result = await this.service.updateNote(id, dto.note);
    return apiResponse(result, 'Cập nhật ghi chú thành công');
  }

  @Roles(...ADMIN_ROLES)
  @Get(':id/history')
  async getHistory(@Param('id') id: string) {
    const result = await this.service.getStatusHistory(id);
    return apiResponse(result, 'Lấy lịch sử thành công');
  }
}
