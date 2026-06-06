import { Controller, Get, Post, Put, Delete, Param, Body, Req } from '@nestjs/common';
import { CartsService } from './carts.service';

@Controller('carts')
export class CartsController {
  constructor(private readonly service: CartsService) {}

  @Get()
  findOrCreate(@Req() req: any) {
    return this.service.findOrCreate(req.user?.sub, req.headers['x-session-id']);
  }

  @Post('items')
  addItem(@Req() req: any, @Body() dto: any) {
    return this.service.addItem(req.user?.sub, req.headers['x-session-id'], dto);
  }

  @Put('items/:itemId')
  updateItem(@Param('itemId') itemId: string, @Body() dto: any) {
    return this.service.updateItem(itemId, dto);
  }

  @Delete('items/:itemId')
  removeItem(@Param('itemId') itemId: string) {
    return this.service.removeItem(itemId);
  }

  @Delete()
  clear(@Req() req: any) {
    return this.service.clear(req.user?.sub, req.headers['x-session-id']);
  }
}
