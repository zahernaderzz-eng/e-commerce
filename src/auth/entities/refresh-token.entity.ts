import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity()
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  token: string;

  @Column({ unique: true })
  userId: string;

  @Column()
  expiryDate: Date;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn()
  user: User;
}
