import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private roleService: RolesService,
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

  async getUserPermission(userId: number) {
    const user = await this.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    if (!user) {
      throw new BadRequestException('user not found');
    }

    const role = user.role;

    if (!role) {
      throw new BadRequestException('role not found');
    }

    const fullRole = await this.roleService.getRoleById(role.id);

    if (!fullRole) {
      throw new BadRequestException('role not found');
    }

    return fullRole.permissions;
  }
}
