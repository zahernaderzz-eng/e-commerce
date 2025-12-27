import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../../user/entities/user.entity';

@Entity('reset_tokens')
@Index(['userId', 'expiryDate'])
export class ResetToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 64 })
  @Index()
  token: string;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'expiry_date', type: 'timestamp' })
  expiryDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
