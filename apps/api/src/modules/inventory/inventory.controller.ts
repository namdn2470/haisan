import { Controller, Get, Post, Put, Param, Body, Query, Req } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { ADMIN_ROLES, Roles } from '../../common/roles.decorator';
import { apiResponse } from '../../common/api-response';

@Roles(...ADMIN_ROLES)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get()
  async findAll(
    @Query('productId') productId?: string,
    @Query('lowStock') lowStock?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.service.findAll({
      productId,
      lowStock: lowStock === 'true',
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
    return apiResponse(result, 'Lấy danh sách tồn kho thành công');
  }

  @Get('logs')
  async findLogs(
    @Query('productId') productId?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.service.findLogs({
      productId,
      type,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
    return apiResponse(result, 'Lấy lịch sử tồn kho thành công');
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.service.findOne(id);
    return apiResponse(result, 'Lấy chi tiết tồn kho thành công');
  }

  @Post('import')
  async importStock(@Body() dto: any, @Req() req: any) {
    const result = await this.service.adjustStock({
      type: 'IMPORT',
      productId: dto.productId,
      variantId: dto.variantId,
      quantity: dto.quantity,
      note: dto.note,
      createdBy: req.user?.name || req.user?.sub || 'Admin',
    });
    return apiResponse(result, 'Nhập kho thành công');
  }

  @Post('export')
  async exportStock(@Body() dto: any, @Req() req: any) {
    const result = await this.service.adjustStock({
      type: 'EXPORT',
      productId: dto.productId,
      variantId: dto.variantId,
      quantity: dto.quantity,
      note: dto.note,
      createdBy: req.user?.name || req.user?.sub || 'Admin',
    });
    return apiResponse(result, 'Xuất kho thành công');
  }

  @Post('adjust')
  async adjustStock(@Body() dto: any, @Req() req: any) {
    const result = await this.service.adjustStock({
      type: 'ADJUSTMENT',
      productId: dto.productId,
      variantId: dto.variantId,
      newQuantity: dto.newQuantity,
      note: dto.note,
      createdBy: req.user?.name || req.user?.sub || 'Admin',
    });
    return apiResponse(result, 'Điều chỉnh tồn kho thành công');
  }

  @Put(':id')
  async updateThreshold(@Param('id') id: string, @Body() dto: any) {
    const result = await this.service.updateThreshold(id, dto.lowStockThreshold);
    return apiResponse(result, 'Cập nhật ngưỡng kho thành công');
  }
}
