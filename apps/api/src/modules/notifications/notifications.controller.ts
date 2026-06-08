import { Controller, Get, Post, Put, Param, Body, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ADMIN_ROLES, Roles } from '../../common/roles.decorator';

@Roles(...ADMIN_ROLES)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.user?.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Put(':id/read')
  markRead(@Param('id') id: string) {
    return this.service.markRead(id);
  }

  @Put('read-all')
  markAllRead(@Req() req: any) {
    return this.service.markAllRead(req.user?.sub);
  }
}
