import { Controller, Get, Post, Put, Param, Body, Query, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Public } from '../../common/public.decorator';
import { ADMIN_ROLES, Roles } from '../../common/roles.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Get()
  findAll(
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
    return this.service.findAll(userId, req.user?.role, {
      search,
      status,
      paymentStatus,
      startDate,
      endDate,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
  }

  @Public()
  @Get('my')
  findMy(
    @Query('orderCode') orderCode?: string,
  ) {
    return this.service.findByOrderCode(orderCode);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.service.findOne(id, req.user?.sub, req.user?.role);
  }

  @Public()
  @Post()
  create(@Req() req: any, @Body() dto: any) {
    const userId = req.user?.sub;
    return this.service.create(userId, dto);
  }

  @Roles(...ADMIN_ROLES)
  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: { status: string; note?: string; actorName?: string },
  ) {
    return this.service.updateStatus(id, dto.status, dto.note, dto.actorName);
  }

  @Roles(...ADMIN_ROLES)
  @Put(':id/note')
  updateNote(@Param('id') id: string, @Body() dto: { note: string }) {
    return this.service.updateNote(id, dto.note);
  }

  @Roles(...ADMIN_ROLES)
  @Get(':id/history')
  getHistory(@Param('id') id: string) {
    return this.service.getStatusHistory(id);
  }
}
