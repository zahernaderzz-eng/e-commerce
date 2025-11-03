import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entityes/user.entity';
import { RefreshToken } from './entityes/refresh-token.entity';
import { ResetToken } from './entityes/reset-token-entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MailModule,
    TypeOrmModule.forFeature([User, RefreshToken, ResetToken]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
