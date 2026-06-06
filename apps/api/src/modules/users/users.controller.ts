import { Controller, Get, Put, Delete, Param, Body, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { Public } from '../../common/public.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Public()
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('me')
  getMe(@Req() req: any) {
    return this.service.findOne(req.user.sub);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Public()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
