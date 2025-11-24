import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('reviews')
@Index(['user', 'product'], { unique: true })
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (u) => u.reviews, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Product, (p) => p.reviews, { onDelete: 'CASCADE' })
  product: Product;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
