import { Controller, Get, Put, Delete, Param, Body, Query, Req, ParseUUIDPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { ADMIN_ROLES, Roles } from '../../common/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  // Static paths MUST come before :id param route

  @Get('me')
  getMe(@Req() req: any) {
    return this.service.findOne(req.user?.sub || req.user?.id);
  }

  @Roles(...ADMIN_ROLES)
  @Get('customers')
  findAllCustomers(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAllCustomers({
      search,
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Roles(...ADMIN_ROLES)
  @Get('customers/:id')
  findCustomer(@Param('id') id: string) {
    return this.service.findCustomer(id);
  }

  @Roles(...ADMIN_ROLES)
  @Get('customers/:id/orders')
  getCustomerOrders(@Param('id') id: string) {
    return this.service.getCustomerOrders(id);
  }

  @Roles(...ADMIN_ROLES)
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll({
      search,
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Roles(...ADMIN_ROLES)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Roles(...ADMIN_ROLES)
  @Put(':id/status')
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: { status: string }) {
    return this.service.updateStatus(id, dto.status);
  }

  @Roles(...ADMIN_ROLES)
  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Roles(...ADMIN_ROLES)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
