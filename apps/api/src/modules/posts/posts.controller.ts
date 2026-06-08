import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Public } from '../../common/public.decorator';
import { ADMIN_ROLES, isAdminRole, Roles } from '../../common/roles.decorator';

@Roles(...ADMIN_ROLES)
@Controller('posts')
export class PostsController {
  constructor(private readonly service: PostsService) {}

  @Public()
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Req() req?: any,
  ) {
    const admin = isAdminRole(req?.user?.role);
    return this.service.findAll({
      search: admin ? search : undefined,
      status: admin ? status : 'PUBLISHED',
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      publicOnly: !admin,
    });
  }

  @Public()
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug, true);
  }

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

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
