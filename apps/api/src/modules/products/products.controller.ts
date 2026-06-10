import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Public } from '../../common/public.decorator';
import { ADMIN_ROLES, isAdminRole, Roles } from '../../common/roles.decorator';
import { apiResponse } from '../../common/api-response';

@Roles(...ADMIN_ROLES)
@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Public()
  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('lowStock') lowStock?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('bestSeller') bestSeller?: string,
    @Query('featured') featured?: string,
    @Query('all') all?: string,
    @Req() req?: any,
  ) {
    const admin = isAdminRole(req?.user?.role);
    const result = await this.service.findAll({
      category,
      search,
      status,
      lowStock: lowStock === 'true',
      sort,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      bestSeller: bestSeller === 'true',
      featured: featured === 'true',
      all: admin && all === 'true',
      publicOnly: !admin,
    });
    return apiResponse(result, 'Lấy danh sách sản phẩm thành công');
  }

  @Public()
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const result = await this.service.findBySlug(slug, true);
    return apiResponse(result, 'Lấy sản phẩm thành công');
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.service.findOne(id);
    return apiResponse(result, 'Lấy chi tiết sản phẩm thành công');
  }

  @Post()
  async create(@Body() dto: any) {
    const result = await this.service.create(dto);
    return apiResponse(result, 'Tạo sản phẩm thành công');
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const result = await this.service.update(id, dto);
    return apiResponse(result, 'Cập nhật sản phẩm thành công');
  }

  @Put(':id/images')
  async updateImages(@Param('id') id: string, @Body() dto: { images: Array<{ imageUrl: string; isThumbnail?: boolean }> }) {
    const result = await this.service.updateImages(id, dto.images);
    return apiResponse(result, 'Cập nhật hình ảnh sản phẩm thành công');
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.service.remove(id);
    return apiResponse(result, 'Xóa sản phẩm thành công');
  }
}
