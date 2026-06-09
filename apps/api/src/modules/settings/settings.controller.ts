import {
  Controller,
  Get,
  Put,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Public } from '../../common/public.decorator';
import { ADMIN_ROLES, Roles } from '../../common/roles.decorator';
import { apiResponse } from '../../common/api-response';
import { UpdateStoreSettingsDto } from './dto/update-settings.dto';

@Roles(...ADMIN_ROLES)
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  async getSettings() {
    const settings = await this.settingsService.getSettings();
    return apiResponse(settings, 'Lấy cài đặt thành công');
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  async updateSettings(@Body() dto: UpdateStoreSettingsDto) {
    const settings = await this.settingsService.updateSettings(dto);
    return apiResponse(settings, 'Lưu cài đặt thành công');
  }

  @Public()
  @Get('public')
  async getPublicSettings() {
    const settings = await this.settingsService.getPublicSettings();
    return apiResponse(settings, 'Lấy cài đặt công khai thành công');
  }
}
