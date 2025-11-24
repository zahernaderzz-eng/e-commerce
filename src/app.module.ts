import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ResetToken } from './auth/entities/reset-token-entity';
import { MailModule } from './mail/mail.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OTPModule } from './otp/otp.module';
import { OTP } from './otp/entities/otp.entity';
import { UserModule } from './user/user.module';
import { User } from './user/entities/user.entity';
import { RolesModule } from './roles/roles.module';
import { Role } from './roles/entities/role.entity';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { Category } from './categories/entities/category.entity';
import { Product } from './products/entities/product.entity';
import { ProductImage } from './products/entities/product-image.entity';
import { CloudinaryModule } from './cloudianry/cloudinary.module';
import { BullModule } from '@nestjs/bullmq';
import { OrdersModule } from './orders/orders.module';
import { CartModule } from './cart/cart.module';
import { CartItem } from './cart/entities/cart-item.entity';
import { Cart } from './cart/entities/cart.entity';
import { OrderItem } from './orders/entities/order-item.entity';
import { Order } from './orders/entities/order.entity';
import { PaymentModule } from './payment/payment.module';
import { NotificationModule } from './notification/notification.module';
import { FcmTokenModule } from './fcm-token/fcm-token.module';
import { FcmToken } from './fcm-token/entities/fcm-token.entity';
import { Notification } from './notification/entities/notification.entity'; // ← إضافة
import { FollowersModule } from './followers/followers.module';
import { ReviewsModule } from './reviews/reviews.module';
import { Review } from './reviews/entities/review.entity';
import { Follower } from './followers/entities/follower.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.development',
    }),

    BullModule.forRoot({
      connection: {
        host: '127.0.0.1',
        port: 6379,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [
          User,
          ResetToken,
          OTP,
          Role,
          Category,
          Product,
          ProductImage,
          Cart,
          CartItem,
          Order,
          OrderItem,
          FcmToken,
          Notification,
          Review,
          Follower,
        ],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),

    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_ACCESS_EXPIRES_IN') || '1h',
        },
      }),
      inject: [ConfigService],
    }),

    AuthModule,
    MailModule,
    OTPModule,
    UserModule,
    RolesModule,
    ProductsModule,
    CategoriesModule,
    CloudinaryModule,
    OrdersModule,
    CartModule,
    PaymentModule,
    FcmTokenModule,
    NotificationModule,
    FollowersModule,
    ReviewsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
