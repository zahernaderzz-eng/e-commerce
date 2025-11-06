import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendPasswordResetEmail(to: string, token: string) {
    const resetLink = `http://yourapp.com/reset-password?token=${token}`;
    const mailOptions = {
      from: 'Auth-backend service',
      to: to,
      subject: 'Password Reset Request',
      html: `<p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetLink}">Reset Password</a></p>`,
    };

    await this.mailerService.sendMail(mailOptions);
  }

  async sendOtpViaEmail(to: string, otp: string) {
    const mailOptions = {
      from: 'Auth-backend service',
      to: to,
      subject: 'OTP Request',
      html: `<p>Your otp code is :<strong>${otp}</strong></p>.
      <br /> Provide this otp to verify your account`,
    };

    await this.mailerService.sendMail(mailOptions);
  }
}
