import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RefreshToken } from './entities/refresh-token.entity';
import { ResetToken } from './entities/reset-token-entity';
import { MailModule } from '../mail/mail.module';
import { OTPModule } from '../otp/otp.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    UserModule,
    OTPModule,
    MailModule,
    TypeOrmModule.forFeature([RefreshToken, ResetToken]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
