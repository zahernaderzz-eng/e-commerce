import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResetToken } from './entities/reset-token-entity';
import { MailModule } from '../mail/mail.module';
import { OTPModule } from '../otp/otp.module';
import { UserModule } from '../user/user.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    UserModule,
    OTPModule,
    MailModule,
    TypeOrmModule.forFeature([ResetToken]),
    BullModule.registerQueue({ name: 'email' }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
