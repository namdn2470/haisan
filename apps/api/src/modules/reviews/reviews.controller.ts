import { Controller, Get, Post, Put, Param, Body, Query, Req } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { Public } from '../../common/public.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly service: ReviewsService) {}

  @Public()
  @Get()
  findAll(@Query('productId') productId?: string) {
    return this.service.findAll(productId);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Req() req: any, @Body() dto: any) {
    return this.service.create(req.user?.sub, dto);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: { status: string }) {
    return this.service.updateStatus(id, dto.status);
  }
}
