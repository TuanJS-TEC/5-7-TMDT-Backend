import { Injectable, NotFoundException } from '@nestjs/common';
import { MOCK_USERS, UserAccount } from './user-management.mock';

@Injectable()
export class UserManagementService {
  private users = new Map<string, UserAccount>(MOCK_USERS.map(u => [u.id, { ...u }]));

  /**
   * UC43: Lấy danh sách người dùng
   */
  findAll() {
    return Array.from(this.users.values());
  }

  /**
   * UC43: Lấy chi tiết người dùng
   */
  findOne(id: string) {
    const user = this.users.get(id);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }

  /**
   * UC43: Cập nhật trạng thái người dùng (Ban/Unban)
   */
  updateStatus(id: string, status: 'active' | 'banned') {
    const user = this.users.get(id);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    
    user.status = status;
    this.users.set(id, user);
    
    return { success: true, message: `Người dùng đã được chuyển sang trạng thái ${status}`, user };
  }
}
