import { Controller, Get, Put, Delete, Param, Body, Query, Req, ParseUUIDPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { ADMIN_ROLES, Roles } from '../../common/roles.decorator';
import { apiResponse } from '../../common/api-response';

@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  // Static paths MUST come before :id param route

  @Get('me')
  async getMe(@Req() req: any) {
    const result = await this.service.findOne(req.user?.sub || req.user?.id);
    return apiResponse(result, 'Lấy thông tin người dùng thành công');
  }

  @Roles(...ADMIN_ROLES)
  @Get('customers')
  async findAllCustomers(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.service.findAllCustomers({
      search,
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
    return apiResponse(result, 'Lấy danh sách khách hàng thành công');
  }

  @Roles(...ADMIN_ROLES)
  @Get('customers/:id')
  async findCustomer(@Param('id') id: string) {
    const result = await this.service.findCustomer(id);
    return apiResponse(result, 'Lấy thông tin khách hàng thành công');
  }

  @Roles(...ADMIN_ROLES)
  @Get('customers/:id/orders')
  async getCustomerOrders(@Param('id') id: string) {
    const result = await this.service.getCustomerOrders(id);
    return apiResponse(result, 'Lấy đơn hàng khách hàng thành công');
  }

  @Roles(...ADMIN_ROLES)
  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.service.findAll({
      search,
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
    return apiResponse(result, 'Lấy danh sách người dùng thành công');
  }

  @Roles(...ADMIN_ROLES)
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.service.findOne(id);
    return apiResponse(result, 'Lấy chi tiết người dùng thành công');
  }

  @Roles(...ADMIN_ROLES)
  @Put(':id/status')
  async updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: { status: string }) {
    const result = await this.service.updateStatus(id, dto.status);
    return apiResponse(result, 'Cập nhật trạng thái thành công');
  }

  @Roles(...ADMIN_ROLES)
  @Put(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) {
    const result = await this.service.update(id, dto);
    return apiResponse(result, 'Cập nhật người dùng thành công');
  }

  @Roles(...ADMIN_ROLES)
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.service.remove(id);
    return apiResponse(result, 'Xóa người dùng thành công');
  }
}
