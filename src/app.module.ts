// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';

// infra & shared
import { DatabaseModule } from './infrastructure/database/database.module';
import { BullConfigModule } from './infrastructure/bull/bull.config.module';
import { CloudinaryModule } from './infrastructure/cloudianry/cloudinary.module';
import { MailModule } from './mail/mail.module';

// features
import { AuthModule } from './auth/auth.module';
import { OTPModule } from './otp/otp.module';
import { UserModule } from './user/user.module';
import { RolesModule } from './roles/roles.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { OrdersModule } from './orders/orders.module';
import { CartModule } from './cart/cart.module';
import { PaymentModule } from './payment/payment.module';
import { NotificationModule } from './notification/notification.module';
import { FcmTokenModule } from './fcm-token/fcm-token.module';
import { FollowersModule } from './followers/followers.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.development',
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 10,
      },
    ]),

    // infrastructure
    DatabaseModule,
    BullConfigModule,
    CloudinaryModule,
    MailModule,

    // JWT global
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

    // feature modules
    AuthModule,
    OTPModule,
    UserModule,
    RolesModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    CartModule,
    PaymentModule,
    FcmTokenModule,
    NotificationModule,
    FollowersModule,
    ReviewsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
