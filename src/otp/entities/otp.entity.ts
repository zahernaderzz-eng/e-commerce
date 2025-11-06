import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { OTPType } from '../type/OTPType';

@Entity()
export class OTP {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn()
  user: User;

  @Column()
  token: string; //hashed otp for verification or reset token for password

  @Column({ type: 'enum', enum: OTPType })
  type: OTPType;

  @Column()
  expireAt: Date;

  @Column()
  createdAt: Date;
}
