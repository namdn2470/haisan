import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { BannersService } from './banners.service';
import { Public } from '../../common/public.decorator';
import { ADMIN_ROLES, isAdminRole, Roles } from '../../common/roles.decorator';

@Roles(...ADMIN_ROLES)
@Controller('banners')
export class BannersController {
  constructor(private readonly service: BannersService) {}

  @Public()
  @Get()
  findAll(
    @Query('position') position?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Req() req?: any,
  ) {
    const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    const admin = isAdminRole(req?.user?.role);
    return this.service.findAll({
      position,
      isActive: admin ? isActiveBool : true,
      search: admin ? search : undefined,
      publicOnly: !admin,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
