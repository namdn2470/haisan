import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  @Get('revenue')
  getRevenue() {
    return this.service.getRevenue();
  }

  @Get('best-sellers')
  getBestSellers() {
    return this.service.getBestSellers();
  }
}
