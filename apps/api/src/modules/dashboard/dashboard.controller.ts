import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ADMIN_ROLES, Roles } from '../../common/roles.decorator';
import { apiResponse } from '../../common/api-response';

@Roles(...ADMIN_ROLES)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('stats')
  async getStats() {
    const result = await this.service.getStats();
    return apiResponse(result, 'Lấy thống kê dashboard thành công');
  }

  @Get('revenue')
  async getRevenue() {
    const result = await this.service.getRevenue();
    return apiResponse(result, 'Lấy doanh thu thành công');
  }

  @Get('best-sellers')
  async getBestSellers() {
    const result = await this.service.getBestSellers();
    return apiResponse(result, 'Lấy sản phẩm bán chạy thành công');
  }
}
