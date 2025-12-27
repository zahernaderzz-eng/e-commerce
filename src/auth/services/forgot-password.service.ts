import { Injectable, Logger } from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { EmailQueueService } from '../../mail/email-queue.service';
import { ResetTokenRepository } from '../Repository/reset-token.repository';

@Injectable()
export class ForgotPasswordService {
  private readonly logger = new Logger(ForgotPasswordService.name);

  constructor(
    private userService: UserService,
    private emailQueue: EmailQueueService,
    private resetTokenRepository: ResetTokenRepository,
  ) {}

  async execute(email: string): Promise<{ message: string }> {
    const user = await this.userService.findOneBy({ email });

    if (user) {
      const resetToken = await this.resetTokenRepository.createTokenIfAllowed(
        user.id,
      );

      if (resetToken) {
        try {
          await this.emailQueue.sendPasswordReset({
            to: email,
            token: resetToken,
          });
        } catch (error) {
          this.logger.error(
            `Failed to queue password reset email: ${email}`,
            error.stack,
          );
        }
      } else {
        this.logger.warn(`Rate limit hit for forgot password: ${email}`);
      }
    }

    return {
      message: 'If this user exists, they will receive an email',
    };
  }
}
