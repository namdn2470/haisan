import { Controller, Get, Post, Put, Delete, Param, Body, Query, NotFoundException, BadRequestException } from '@nestjs/common';
import { RolesService } from './roles.service';
import { ADMIN_ROLES, Roles } from '../../common/roles.decorator';
import { apiResponse } from '../../common/api-response';

@Roles(...ADMIN_ROLES)
@Controller('roles')
export class RolesController {
  constructor(private readonly service: RolesService) {}

  @Get()
  async findAll(@Query('search') search?: string, @Query('isActive') isActive?: string) {
    const result = await this.service.findAll({ search, isActive });
    return apiResponse(result, 'Lấy danh sách vai trò thành công');
  }

  @Get('permissions')
  async getAllPermissions() {
    const result = await this.service.getAllPermissions();
    return apiResponse(result, 'Lấy danh sách quyền thành công');
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const role = await this.service.findOne(id);
    if (!role) throw new NotFoundException('Vai trò không tồn tại');
    return apiResponse(role, 'Lấy chi tiết vai trò thành công');
  }

  @Post()
  async create(@Body() dto: { name: string; slug: string; description?: string; color?: string; permissions?: string[] }) {
    if (!dto.name || !dto.slug) {
      throw new BadRequestException('Tên và slug là bắt buộc');
    }
    const role = await this.service.create(dto);
    return apiResponse(role, 'Tạo vai trò thành công');
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: { name?: string; description?: string; color?: string; permissions?: string[]; isActive?: boolean }) {
    const role = await this.service.update(id, dto);
    if (!role) throw new NotFoundException('Vai trò không tồn tại');
    return apiResponse(role, 'Cập nhật vai trò thành công');
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.service.remove(id);
    if (!result) throw new BadRequestException('Không thể xóa vai trò này');
    return apiResponse(result, 'Xóa vai trò thành công');
  }
}
