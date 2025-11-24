import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follower } from './entities/follower.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class FollowersService {
  constructor(
    @InjectRepository(Follower)
    private followerRepo: Repository<Follower>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async follow(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.followerRepo.findOne({
      where: { user: { id: userId } },
    });

    if (existing) throw new ConflictException('You already follow the store');

    const follower = this.followerRepo.create({ user });
    return await this.followerRepo.save(follower);
  }

  async unfollow(userId: number) {
    const existing = await this.followerRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!existing) return;

    await this.followerRepo.delete(existing.id);
  }

  async list(page = 1, limit = 20) {
    return await this.followerRepo.find({
      relations: ['user'],
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    });
  }
  async getAllFollowerUserIds(): Promise<number[]> {
    const followers = await this.followerRepo.find({
      relations: ['user'],
      select: {
        user: { id: true },
      },
    });

    return followers.map((f) => f.user.id);
  }
}
