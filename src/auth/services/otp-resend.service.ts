import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ResendOtpDto } from '../dtos/request.OTP.dto';
import { UserService } from '../../user/user.service';
import { OTPService } from '../../otp/otp.service';
import { EmailQueueService } from '../../mail/email-queue.service';
import { AccountStatus } from '../../user/enums/account.status.enum';
import { OTPType } from '../../otp/type/OTPType';

@Injectable()
export class OtpResendService {
  private readonly logger = new Logger(OtpResendService.name);
  constructor(
    private readonly userService: UserService,
    private readonly otpService: OTPService,
    private readonly emailQueue: EmailQueueService,
  ) {}
  async execute(dto: ResendOtpDto) {
    const { email } = dto;
    const user = await this.userService.findByEmail(email);
    if (!user) {
      return { message: 'If your account exists, a new OTP has been sent' };
    }
    if (user.accountStatus === AccountStatus.VERIFIED) {
      throw new BadRequestException('Account already verified');
    }
    const otp = await this.otpService.generateOTP(user, OTPType.OTP);
    try {
      await this.emailQueue.sendOtp({
        to: email,
        otp,
      });
      this.logger.log(`OTP sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Faild to send OTP email to ${email}:`, error.stack);
    }
    return { message: 'A new OTP has been sent to your email.' };
  }
}
