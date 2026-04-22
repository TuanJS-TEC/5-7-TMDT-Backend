import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOrmEntity } from '@car-marketplace/database';

@Injectable()
export class UserManagementService {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
  ) {}

  /**
   * UC43: Lấy danh sách người dùng
   */
  async findAll() {
    return this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * UC43: Lấy chi tiết người dùng
   */
  async findOne(id: string) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }

  /**
   * UC43: Cập nhật trạng thái người dùng (Ban/Unban)
   */
  async updateStatus(id: string, status: 'active' | 'banned') {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    
    user.adminLocked = (status === 'banned');
    await this.userRepository.save(user);
    
    return { 
      success: true, 
      message: `Người dùng đã được chuyển sang trạng thái ${status}`, 
      user 
    };
  }
}
