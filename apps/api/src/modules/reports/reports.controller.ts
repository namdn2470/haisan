import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ADMIN_ROLES, Roles } from '../../common/roles.decorator';
import { apiResponse } from '../../common/api-response';

@Roles(...ADMIN_ROLES)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('revenue')
  async getRevenueReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.reportsService.getRevenueReport(startDate, endDate);
    return apiResponse(result, 'Lấy báo cáo doanh thu thành công');
  }

  @Get('orders')
  async getOrdersReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.reportsService.getOrdersReport(startDate, endDate);
    return apiResponse(result, 'Lấy báo cáo đơn hàng thành công');
  }

  @Get('products')
  async getProductsReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.reportsService.getProductsReport(startDate, endDate, limit ? parseInt(limit) : 10);
    return apiResponse(result, 'Lấy báo cáo sản phẩm thành công');
  }

  @Get('customers')
  async getCustomersReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.reportsService.getCustomersReport(startDate, endDate, limit ? parseInt(limit) : 10);
    return apiResponse(result, 'Lấy báo cáo khách hàng thành công');
  }

  @Get('inventory')
  async getInventoryReport() {
    const result = await this.reportsService.getInventoryReport();
    return apiResponse(result, 'Lấy báo cáo tồn kho thành công');
  }

  @Get('summary')
  async getSummaryReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.reportsService.getSummaryReport(startDate, endDate);
    return apiResponse(result, 'Lấy tổng hợp báo cáo thành công');
  }

  @Get('export/revenue')
  async exportRevenueCsv(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.reportsService.exportRevenueCsv(startDate, endDate);
    return apiResponse(result, 'Xuất file doanh thu thành công');
  }

  @Get('export/orders')
  async exportOrdersCsv(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.reportsService.exportOrdersCsv(startDate, endDate);
    return apiResponse(result, 'Xuất file đơn hàng thành công');
  }

  @Get('export/products')
  async exportProductsCsv(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.reportsService.exportProductsCsv(startDate, endDate, limit ? parseInt(limit) : 50);
    return apiResponse(result, 'Xuất file sản phẩm thành công');
  }
}
