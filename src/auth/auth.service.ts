import { Injectable } from '@nestjs/common';
import { SignupDto } from './dtos/signup.dto';
import { LoginDto } from './dtos/login.dto';
import { ResendOtpDto } from './dtos/request.OTP.dto';
import { SignupService } from './services/signup.service';
import { LoginService } from './services/login.service';
import { PasswordChangeService } from './services/password-change.service';
import { ChangePasswordDto } from './dtos/change-passord.dto';
import { OtpResendService } from './services/otp-resend.service';
import { ForgotPasswordService } from './services/forgot-password.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { ResetPasswordService } from './services/reset-password.service';
@Injectable()
export class AuthService {
  constructor(
    private signupService: SignupService,
    private loginService: LoginService,
    private passwordChangeService: PasswordChangeService,
    private otpResendService: OtpResendService,
    private forgotPasswordService: ForgotPasswordService,
    private refreshTokenService: RefreshTokenService,
    private resetPasswordService: ResetPasswordService,
  ) {}

  // ───────────────────────────────────────────────

  async signup(signupData: SignupDto) {
    return this.signupService.execute(signupData);
  }

  // ───────────────────────────────────────────────

  async login(credentials: LoginDto) {
    return this.loginService.execute(credentials);
  }
  // ───────────────────────────────────────────────

  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.forgotPasswordService.execute(email);
  }
  // ───────────────────────────────────────────────

  async resetPassword(newPassword: string, resetToken: string) {
    return this.resetPasswordService.execute(newPassword, resetToken);
  }

  // ───────────────────────────────────────────────

  async changePassword(userId: number, dto: ChangePasswordDto) {
    return this.passwordChangeService.execute(dto, userId);
  }

  // ───────────────────────────────────────────────

  async resendOtp(dto: ResendOtpDto): Promise<{ message: string }> {
    return this.otpResendService.execute(dto);
  }

  // ───────────────────────────────────────────────

  async refreshToken(refreshToken: string) {
    return this.refreshTokenService.execute(refreshToken);
  }

  // ───────────────────────────────────────────────
}
