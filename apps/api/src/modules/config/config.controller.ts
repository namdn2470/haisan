import { Controller, Get, Post, Put, Delete, Body, Query, Param } from '@nestjs/common';
import { ConfigService } from './config.service';
import { Public } from '../../common/public.decorator';
import { ADMIN_ROLES, Roles } from '../../common/roles.decorator';

@Roles(...ADMIN_ROLES)
@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  async getAll(@Query('group') group?: string) {
    return this.configService.getAll(group);
  }

  @Public()
  @Get('public')
  async getPublic() {
    return this.configService.getPublic();
  }

  @Get(':key')
  async getByKey(@Param('key') key: string) {
    return this.configService.getByKey(key);
  }

  @Post()
  async create(@Body() body: { key: string; value: string; type?: string; group?: string; label?: string; description?: string }) {
    return this.configService.set(body.key, body.value, body.type, body.group, body.label, body.description);
  }

  @Put('batch')
  async batchUpdate(@Body() body: { items: { key: string; value: string; type?: string; group?: string; label?: string; description?: string }[] }) {
    return this.configService.batchSet(body.items);
  }

  @Put(':key')
  async update(@Param('key') key: string, @Body() body: { value: string; type?: string; group?: string; label?: string; description?: string }) {
    return this.configService.set(key, body.value, body.type, body.group, body.label, body.description);
  }

  @Delete(':key')
  async delete(@Param('key') key: string) {
    return this.configService.delete(key);
  }

  @Post('initialize')
  async initialize() {
    return this.configService.initializeDefaults();
  }
}
