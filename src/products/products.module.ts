import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { CategoriesModule } from '../categories/categories.module';
import { CloudinaryModule } from '../infrastructure/cloudianry/cloudinary.module';
import { UserModule } from '../user/user.module';
import { FollowersModule } from '../followers/followers.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductImage]),
    CategoriesModule,
    CloudinaryModule,
    UserModule,
    FollowersModule,
    NotificationModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
