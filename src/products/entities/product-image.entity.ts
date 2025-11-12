import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Product } from './product.entity';

@Entity('product_images')
export class ProductImage {
  @PrimaryGeneratedColumn()
  id: number;

  // Cloudinary public_id (بتستخدمه لما تحذف الصورة أو تحدثها)
  @Column()
  publicId: string;

  // رابط الصورة الفعلي من Cloudinary
  @Column()
  secureUrl: string;

  // العلاقة: الصورة تخص منتج واحد فقط
  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: 'CASCADE',
  })
  product: Product;
}
