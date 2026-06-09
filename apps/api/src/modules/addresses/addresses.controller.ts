import { Controller, Get, Post, Put, Delete, Param, Body, Req } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { apiResponse } from '../../common/api-response';

@Controller('addresses')
export class AddressesController {
  constructor(private readonly service: AddressesService) {}

  @Get()
  async findAll(@Req() req: any) {
    const result = await this.service.findAll(req.user.sub);
    return apiResponse(result, 'Lấy danh sách địa chỉ thành công');
  }

  @Post()
  async create(@Req() req: any, @Body() dto: any) {
    const result = await this.service.create(req.user.sub, dto);
    return apiResponse(result, 'Tạo địa chỉ thành công');
  }

  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const result = await this.service.update(req.user.sub, id, dto);
    return apiResponse(result, 'Cập nhật địa chỉ thành công');
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const result = await this.service.remove(req.user.sub, id);
    return apiResponse(result, 'Xóa địa chỉ thành công');
  }
}
