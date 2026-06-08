import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { Public } from '../../common/public.decorator';
import { ADMIN_ROLES, isAdminRole, Roles } from '../../common/roles.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly service: ReviewsService) {}

  @Public()
  @Get()
  findAll(
    @Query('productId') productId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('rating') rating?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Req() req?: any,
  ) {
    const admin = isAdminRole(req?.user?.role);
    return this.service.findAll({
      productId,
      status: admin ? status : 'APPROVED',
      search: admin ? search : undefined,
      rating: rating ? parseInt(rating) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      publicOnly: !admin,
    });
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id, true);
  }

  @Post()
  create(@Req() req: any, @Body() dto: any) {
    return this.service.create(req.user?.sub || req.user?.id, dto);
  }

  @Roles(...ADMIN_ROLES)
  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: { status: string }) {
    return this.service.updateStatus(id, dto.status);
  }

  @Roles(...ADMIN_ROLES)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
