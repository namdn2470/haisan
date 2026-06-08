import { Controller, Get, Post, Put, Delete, Param, Body, Req } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Public } from '../../common/public.decorator';
import { ADMIN_ROLES, isAdminRole, Roles } from '../../common/roles.decorator';

@Roles(...ADMIN_ROLES)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Public()
  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll({ includeInactive: isAdminRole(req.user?.role) });
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.service.findOne(id, { includeInactive: isAdminRole(req.user?.role) });
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
