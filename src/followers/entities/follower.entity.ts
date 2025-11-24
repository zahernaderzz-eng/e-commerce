import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('followers')
@Index(['user'], { unique: true }) // user can follow only once
export class Follower {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.followers, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
