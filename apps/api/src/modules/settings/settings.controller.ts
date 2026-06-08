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

@Roles(...ADMIN_ROLES)
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  async updateSettings(@Body() data: any) {
    return this.settingsService.updateSettings(data);
  }

  @Public()
  @Get('public')
  async getPublicSettings() {
    return this.settingsService.getPublicSettings();
  }
}
