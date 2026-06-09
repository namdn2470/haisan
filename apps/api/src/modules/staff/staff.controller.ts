import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { StaffService } from './staff.service';
import { ADMIN_ROLES, Roles } from '../../common/roles.decorator';
import { apiResponse } from '../../common/api-response';

@Roles(...ADMIN_ROLES)
@Controller('staff')
export class StaffController {
  constructor(private readonly service: StaffService) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.service.findAll({
      search,
      role,
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 15,
    });
    return apiResponse(result, 'Lấy danh sách nhân viên thành công');
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.service.findOne(id);
    return apiResponse(result, 'Lấy thông tin nhân viên thành công');
  }

  @Post()
  async create(@Body() dto: any) {
    const result = await this.service.create(dto);
    return apiResponse(result, 'Tạo nhân viên thành công');
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const result = await this.service.update(id, dto);
    return apiResponse(result, 'Cập nhật nhân viên thành công');
  }

  @Put(':id/toggle-status')
  async toggleStatus(@Param('id') id: string) {
    const result = await this.service.toggleStatus(id);
    return apiResponse(result, 'Thay đổi trạng thái nhân viên thành công');
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.service.remove(id);
    return apiResponse(result, 'Xóa nhân viên thành công');
  }
}
