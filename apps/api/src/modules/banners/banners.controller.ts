import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { BannersService } from './banners.service';
import { Public } from '../../common/public.decorator';
import { ADMIN_ROLES, isAdminRole, Roles } from '../../common/roles.decorator';
import { apiResponse } from '../../common/api-response';

@Roles(...ADMIN_ROLES)
@Controller('banners')
export class BannersController {
  constructor(private readonly service: BannersService) {}

  @Public()
  @Get()
  async findAll(
    @Query('position') position?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Req() req?: any,
  ) {
    const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    const admin = isAdminRole(req?.user?.role);
    const result = await this.service.findAll({
      position,
      isActive: admin ? isActiveBool : true,
      search: admin ? search : undefined,
      publicOnly: !admin,
    });
    return apiResponse(result, 'Lấy danh sách banner thành công');
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.service.findOne(id);
    return apiResponse(result, 'Lấy chi tiết banner thành công');
  }

  @Post()
  async create(@Body() dto: any) {
    const result = await this.service.create(dto);
    return apiResponse(result, 'Tạo banner thành công');
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const result = await this.service.update(id, dto);
    return apiResponse(result, 'Cập nhật banner thành công');
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.service.remove(id);
    return apiResponse(result, 'Xóa banner thành công');
  }
}
