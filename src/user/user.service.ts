import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { Role } from '../roles/entities/role.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  //
  async findOneBy(filter: Partial<User>) {
    return this.userRepo.findOneBy(filter);
  }

  async findOne(filter: any) {
    return this.userRepo.findOne(filter);
  }

  async create(data: Partial<User>) {
    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }

  async save(user: User) {
    return this.userRepo.save(user);
  }

  async delete(id: string | number) {
    return this.userRepo.delete(id);
  }

  async findAll() {
    return this.userRepo.find();
  }
  async updateUserRoleByEmail(email: string, roleId: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('User not found');
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');
    if (user.role?.name === 'super_admin') {
      throw new ForbiddenException('Super admin role cannot be changed');
    }
    if (role.name === 'super_admin') {
      throw new ForbiddenException('Cannot assign super_admin role');
    }
    await this.userRepo.update(user.id, { role });
    return { message: 'User role updated successfully' };
  }

  async getUserPermissions(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.role) {
      throw new NotFoundException('Role not assigned to user');
    }

    return user.role.permissions;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }
}
