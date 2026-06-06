import { Controller, Get, Post, Put, Param, Body, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Get()
  findAll(@Req() req: any) {
    const userId = req.user?.sub;
    return this.service.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Req() req: any, @Body() dto: any) {
    const userId = req.user?.sub;
    return this.service.create(userId, dto);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: { status: string }) {
    return this.service.updateStatus(id, dto.status);
  }
}
