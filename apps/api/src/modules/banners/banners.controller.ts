import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { BannersService } from './banners.service';
import { Public } from '../../common/public.decorator';

@Controller('banners')
export class BannersController {
  constructor(private readonly service: BannersService) {}

  @Public()
  @Get()
  findAll(@Query('position') position?: string) {
    return this.service.findAll(position);
  }

  @Public()
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
