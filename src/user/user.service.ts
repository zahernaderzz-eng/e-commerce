import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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
}
