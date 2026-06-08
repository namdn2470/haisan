import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ADMIN_ROLES, Roles } from '../../common/roles.decorator';

@Roles(...ADMIN_ROLES)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('revenue')
  async getRevenueReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getRevenueReport(startDate, endDate);
  }

  @Get('orders')
  async getOrdersReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getOrdersReport(startDate, endDate);
  }

  @Get('products')
  async getProductsReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportsService.getProductsReport(startDate, endDate, limit ? parseInt(limit) : 10);
  }

  @Get('customers')
  async getCustomersReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportsService.getCustomersReport(startDate, endDate, limit ? parseInt(limit) : 10);
  }

  @Get('inventory')
  async getInventoryReport() {
    return this.reportsService.getInventoryReport();
  }

  @Get('summary')
  async getSummaryReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getSummaryReport(startDate, endDate);
  }

  @Get('export/revenue')
  async exportRevenueCsv(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.exportRevenueCsv(startDate, endDate);
  }

  @Get('export/orders')
  async exportOrdersCsv(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.exportOrdersCsv(startDate, endDate);
  }

  @Get('export/products')
  async exportProductsCsv(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportsService.exportProductsCsv(startDate, endDate, limit ? parseInt(limit) : 50);
  }
}
