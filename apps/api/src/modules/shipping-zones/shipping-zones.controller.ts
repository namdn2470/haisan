import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ShippingZonesService } from './shipping-zones.service';
import { ADMIN_ROLES, Roles } from '../../common/roles.decorator';
import { Public } from '../../common/public.decorator';

@Roles(...ADMIN_ROLES)
@Controller('shipping-zones')
export class ShippingZonesController {
  constructor(private readonly service: ShippingZonesService) {}

  @Get()
  findAll(
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.service.findAll({ isActive: isActiveBool, search });
  }

  @Public()
  @Get('quote')
  quote(
    @Query('province') province?: string,
    @Query('district') district?: string,
    @Query('subtotal') subtotal?: string,
  ) {
    return this.service.quote({
      province,
      district,
      subtotal: subtotal ? Number(subtotal) : 0,
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
