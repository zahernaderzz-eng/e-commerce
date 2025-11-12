import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { Product } from '../../products/entities/product.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  password: string;

  @Column({ default: 'unverified' })
  accountStatus: 'verified' | 'unverified'; //bit 0 1

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @OneToMany(() => Product, (product) => product.addedBy)
  products: Product[];

  @OneToMany(() => Category, (category) => category.addedBy)
  categories: Category[];
}
