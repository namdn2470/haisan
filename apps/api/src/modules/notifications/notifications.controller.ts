import { Controller, Get, Post, Put, Param, Body, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ADMIN_ROLES, Roles } from '../../common/roles.decorator';
import { apiResponse } from '../../common/api-response';

@Roles(...ADMIN_ROLES)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  async findAll(@Req() req: any) {
    const result = await this.service.findAll(req.user?.sub);
    return apiResponse(result, 'Lấy danh sách thông báo thành công');
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.service.findOne(id);
    return apiResponse(result, 'Lấy chi tiết thông báo thành công');
  }

  @Post()
  async create(@Body() dto: any) {
    const result = await this.service.create(dto);
    return apiResponse(result, 'Tạo thông báo thành công');
  }

  @Put(':id/read')
  async markRead(@Param('id') id: string) {
    const result = await this.service.markRead(id);
    return apiResponse(result, 'Đánh dấu đã đọc thành công');
  }

  @Put('read-all')
  async markAllRead(@Req() req: any) {
    const result = await this.service.markAllRead(req.user?.sub);
    return apiResponse(result, 'Đánh dấu tất cả đã đọc thành công');
  }
}
