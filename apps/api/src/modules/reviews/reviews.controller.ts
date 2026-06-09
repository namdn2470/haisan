import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { Public } from '../../common/public.decorator';
import { ADMIN_ROLES, isAdminRole, Roles } from '../../common/roles.decorator';
import { apiResponse } from '../../common/api-response';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly service: ReviewsService) {}

  @Public()
  @Get()
  async findAll(
    @Query('productId') productId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('rating') rating?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Req() req?: any,
  ) {
    const admin = isAdminRole(req?.user?.role);
    const result = await this.service.findAll({
      productId,
      status: admin ? status : 'APPROVED',
      search: admin ? search : undefined,
      rating: rating ? parseInt(rating) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      publicOnly: !admin,
    });
    return apiResponse(result, 'Lấy danh sách đánh giá thành công');
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.service.findOne(id, true);
    return apiResponse(result, 'Lấy chi tiết đánh giá thành công');
  }

  @Post()
  async create(@Req() req: any, @Body() dto: any) {
    const result = await this.service.create(req.user?.sub || req.user?.id, dto);
    return apiResponse(result, 'Tạo đánh giá thành công');
  }

  @Roles(...ADMIN_ROLES)
  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() dto: { status: string }) {
    const result = await this.service.updateStatus(id, dto.status);
    return apiResponse(result, 'Cập nhật trạng thái đánh giá thành công');
  }

  @Roles(...ADMIN_ROLES)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.service.remove(id);
    return apiResponse(result, 'Xóa đánh giá thành công');
  }
}
