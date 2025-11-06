import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';

import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import { ResetToken } from './auth/entities/reset-token-entity';
import { MailModule } from './mail/mail.module';
import { ConfigModule } from '@nestjs/config';
import { OTPModule } from './otp/otp.module';
import { OTP } from './otp/entities/otp.entity';
import { UserModule } from './user/user.module';
import { User } from './user/entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.development',
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '1234',
      database: 'e-commerce database',
      entities: [User, RefreshToken, ResetToken, OTP],
      synchronize: true,
    }),
    JwtModule.register({ global: true, secret: 'secret123' }),
    AuthModule,
    MailModule,
    OTPModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
