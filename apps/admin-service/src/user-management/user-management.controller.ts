import { Controller, Get, Param, Patch, Body } from '@nestjs/common';
import { UserManagementService } from './user-management.service';

@Controller('admin/users')
export class UserManagementController {
  constructor(private readonly service: UserManagementService) {}

  /**
   * GET /admin/users
   * UC43: Quản lý người dùng - Lấy danh sách
   */
  @Get()
  findAll() {
    return this.service.findAll();
  }

  /**
   * GET /admin/users/:id
   * UC43: Quản lý người dùng - Chi tiết
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  /**
   * PATCH /admin/users/:id/status
   * UC43: Quản lý người dùng - Cập nhật trạng thái (Ban/Unban)
   */
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'active' | 'banned',
  ) {
    return this.service.updateStatus(id, status);
  }
}
