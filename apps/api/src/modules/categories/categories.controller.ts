import { Controller, Get, Post, Put, Delete, Param, Body, Req } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Public } from '../../common/public.decorator';
import { ADMIN_ROLES, isAdminRole, Roles } from '../../common/roles.decorator';
import { apiResponse } from '../../common/api-response';

@Roles(...ADMIN_ROLES)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Public()
  @Get()
  async findAll(@Req() req: any) {
    const result = await this.service.findAll({ includeInactive: isAdminRole(req.user?.role) });
    return apiResponse(result, 'Lấy danh sách danh mục thành công');
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const result = await this.service.findOne(id, { includeInactive: isAdminRole(req.user?.role) });
    return apiResponse(result, 'Lấy chi tiết danh mục thành công');
  }

  @Post()
  async create(@Body() dto: any) {
    const result = await this.service.create(dto);
    return apiResponse(result, 'Tạo danh mục thành công');
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const result = await this.service.update(id, dto);
    return apiResponse(result, 'Cập nhật danh mục thành công');
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.service.remove(id);
    return apiResponse(result, 'Xóa danh mục thành công');
  }
}
