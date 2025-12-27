import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResetToken } from './Repository/entities/reset-token-entity';
import { MailModule } from '../mail/mail.module';
import { OTPModule } from '../otp/otp.module';
import { UserModule } from '../user/user.module';
import { BullModule } from '@nestjs/bullmq';
import { BcryptPasswordHasher } from './services/password-hasher.service';
import { JwtTokenService } from './services/token.service';
import { ResetTokenRepository } from './Repository/reset-token.repository';
import { SignupService } from './services/signup.service';
import { LoginService } from './services/login.service';
import { PasswordChangeService } from './services/password-change.service';
import { OtpResendService } from './services/otp-resend.service';
import { ForgotPasswordService } from './services/forgot-password.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { ResetPasswordService } from './services/reset-password.service';

@Module({
  imports: [
    UserModule,
    OTPModule,
    MailModule,
    TypeOrmModule.forFeature([ResetToken]),
    BullModule.registerQueue({ name: 'email' }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    BcryptPasswordHasher,
    JwtTokenService,
    ResetTokenRepository,
    SignupService,
    LoginService,
    PasswordChangeService,
    OtpResendService,
    ForgotPasswordService,
    RefreshTokenService,
    ResetPasswordService,
  ],
})
export class AuthModule {}
