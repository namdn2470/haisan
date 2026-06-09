import { Controller, Get, Post, Put, Delete, Body, Query, Param } from '@nestjs/common';
import { ConfigService } from './config.service';
import { Public } from '../../common/public.decorator';
import { ADMIN_ROLES, Roles } from '../../common/roles.decorator';
import { apiResponse } from '../../common/api-response';

@Roles(...ADMIN_ROLES)
@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  async getAll(@Query('group') group?: string) {
    const result = await this.configService.getAll(group);
    return apiResponse(result, 'Lấy danh sách cấu hình thành công');
  }

  @Public()
  @Get('public')
  async getPublic() {
    const result = await this.configService.getPublic();
    return apiResponse(result, 'Lấy cấu hình công khai thành công');
  }

  @Get(':key')
  async getByKey(@Param('key') key: string) {
    const result = await this.configService.getByKey(key);
    return apiResponse(result, 'Lấy cấu hình thành công');
  }

  @Post()
  async create(@Body() body: { key: string; value: string; type?: string; group?: string; label?: string; description?: string }) {
    const result = await this.configService.set(body.key, body.value, body.type, body.group, body.label, body.description);
    return apiResponse(result, 'Tạo cấu hình thành công');
  }

  @Put('batch')
  async batchUpdate(@Body() body: { items: { key: string; value: string; type?: string; group?: string; label?: string; description?: string }[] }) {
    const result = await this.configService.batchSet(body.items);
    return apiResponse(result, 'Cập nhật nhiều cấu hình thành công');
  }

  @Put(':key')
  async update(@Param('key') key: string, @Body() body: { value: string; type?: string; group?: string; label?: string; description?: string }) {
    const result = await this.configService.set(key, body.value, body.type, body.group, body.label, body.description);
    return apiResponse(result, 'Cập nhật cấu hình thành công');
  }

  @Delete(':key')
  async delete(@Param('key') key: string) {
    const result = await this.configService.delete(key);
    return apiResponse(result, 'Xóa cấu hình thành công');
  }

  @Post('initialize')
  async initialize() {
    const result = await this.configService.initializeDefaults();
    return apiResponse(result, 'Khởi tạo cấu hình mặc định thành công');
  }
}
