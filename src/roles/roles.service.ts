import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Repository } from 'typeorm';
import { CreateRoleDto } from './dtos/role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async createRole(role: CreateRoleDto) {
    const roleEntity = await this.roleRepository.create(role);
    await this.roleRepository.save(roleEntity);
  }

  async getRoleById(roleId: number) {
    return this.roleRepository.findOne({ where: { id: roleId } });
  }
}
