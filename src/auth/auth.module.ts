import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ResetToken } from './entities/reset-token-entity';
import { MailModule } from '../mail/mail.module';
import { OTPModule } from '../otp/otp.module';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    UserModule,
    OTPModule,
    MailModule,
    TypeOrmModule.forFeature([ResetToken]),
    BullModule.forRoot({
      connection: { host: 'localhost', port: 6379 },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'fixed', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    BullModule.registerQueue({ name: 'email' }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtModule],
})
export class AuthModule {}
