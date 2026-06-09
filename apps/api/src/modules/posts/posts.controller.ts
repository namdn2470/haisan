import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Public } from '../../common/public.decorator';
import { ADMIN_ROLES, isAdminRole, Roles } from '../../common/roles.decorator';
import { apiResponse } from '../../common/api-response';

@Roles(...ADMIN_ROLES)
@Controller('posts')
export class PostsController {
  constructor(private readonly service: PostsService) {}

  @Public()
  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Req() req?: any,
  ) {
    const admin = isAdminRole(req?.user?.role);
    const result = await this.service.findAll({
      search: admin ? search : undefined,
      status: admin ? status : 'PUBLISHED',
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      publicOnly: !admin,
    });
    return apiResponse(result, 'Lấy danh sách bài viết thành công');
  }

  @Public()
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const result = await this.service.findBySlug(slug, true);
    return apiResponse(result, 'Lấy bài viết thành công');
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.service.findOne(id);
    return apiResponse(result, 'Lấy chi tiết bài viết thành công');
  }

  @Post()
  async create(@Body() dto: any) {
    const result = await this.service.create(dto);
    return apiResponse(result, 'Tạo bài viết thành công');
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const result = await this.service.update(id, dto);
    return apiResponse(result, 'Cập nhật bài viết thành công');
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.service.remove(id);
    return apiResponse(result, 'Xóa bài viết thành công');
  }
}
