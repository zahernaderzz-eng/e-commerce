import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { UserModule } from '../user/user.module';
import { ProductsModule } from '../products/products.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Cart, CartItem]),
    UserModule,
    ProductsModule,
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
