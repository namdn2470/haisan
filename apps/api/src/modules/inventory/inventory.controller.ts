import { Controller, Get, Post, Put, Param, Body, Query, Req } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { ADMIN_ROLES, Roles } from '../../common/roles.decorator';

@Roles(...ADMIN_ROLES)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get()
  findAll(
    @Query('productId') productId?: string,
    @Query('lowStock') lowStock?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll({
      productId,
      lowStock: lowStock === 'true',
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
  }

  @Get('logs')
  findLogs(
    @Query('productId') productId?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findLogs({
      productId,
      type,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('import')
  importStock(@Body() dto: any, @Req() req: any) {
    return this.service.adjustStock({
      type: 'IMPORT',
      productId: dto.productId,
      variantId: dto.variantId,
      quantity: dto.quantity,
      note: dto.note,
      createdBy: req.user?.name || req.user?.sub || 'Admin',
    });
  }

  @Post('export')
  exportStock(@Body() dto: any, @Req() req: any) {
    return this.service.adjustStock({
      type: 'EXPORT',
      productId: dto.productId,
      variantId: dto.variantId,
      quantity: dto.quantity,
      note: dto.note,
      createdBy: req.user?.name || req.user?.sub || 'Admin',
    });
  }

  @Post('adjust')
  adjustStock(@Body() dto: any, @Req() req: any) {
    return this.service.adjustStock({
      type: 'ADJUSTMENT',
      productId: dto.productId,
      variantId: dto.variantId,
      newQuantity: dto.newQuantity,
      note: dto.note,
      createdBy: req.user?.name || req.user?.sub || 'Admin',
    });
  }

  @Put(':id')
  updateThreshold(@Param('id') id: string, @Body() dto: any) {
    return this.service.updateThreshold(id, dto.lowStockThreshold);
  }
}
