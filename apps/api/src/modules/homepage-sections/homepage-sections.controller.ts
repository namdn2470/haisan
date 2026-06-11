import { Controller, Get, Put, Body, Param } from '@nestjs/common';
import { HomepageSectionsService } from './homepage-sections.service';
import { Public } from '../../common/public.decorator';
import { ADMIN_ROLES, Roles } from '../../common/roles.decorator';
import { apiResponse } from '../../common/api-response';

@Controller('homepage-sections')
export class HomepageSectionsController {
  constructor(private readonly service: HomepageSectionsService) {}

  @Public()
  @Get('public')
  async findAllPublic() {
    const data = await this.service.findAllPublic();
    return apiResponse(data, 'Lấy cấu hình trang chủ thành công');
  }

  @Roles(...ADMIN_ROLES)
  @Get()
  async findAll() {
    const data = await this.service.findAllAdmin();
    return apiResponse(data, 'Lấy danh sách section thành công');
  }

  @Roles(...ADMIN_ROLES)
  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    const data = await this.service.findOneAdmin(slug);
    return apiResponse(data, 'Lấy chi tiết section thành công');
  }

  @Roles(...ADMIN_ROLES)
  @Put(':slug')
  async upsert(@Param('slug') slug: string, @Body() dto: any) {
    const data = await this.service.upsertSection(slug, dto);
    return apiResponse(data, 'Lưu section thành công');
  }
}
