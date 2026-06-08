import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Public } from '../../common/public.decorator';
import { ADMIN_ROLES, isAdminRole, Roles } from '../../common/roles.decorator';

@Roles(...ADMIN_ROLES)
@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Public()
  @Get()
  findAll(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('lowStock') lowStock?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('bestSeller') bestSeller?: string,
    @Query('all') all?: string,
    @Req() req?: any,
  ) {
    const admin = isAdminRole(req?.user?.role);
    return this.service.findAll({
      category,
      search,
      status,
      lowStock: lowStock === 'true',
      sort,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      bestSeller: bestSeller === 'true',
      all: admin && all === 'true',
      publicOnly: !admin,
    });
  }

  @Public()
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug, true);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Put(':id/images')
  updateImages(@Param('id') id: string, @Body() dto: { images: Array<{ imageUrl: string; isThumbnail?: boolean }> }) {
    return this.service.updateImages(id, dto.images);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
