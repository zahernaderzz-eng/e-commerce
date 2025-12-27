import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ResetToken } from '../Repository/entities/reset-token-entity';
import { BcryptPasswordHasher } from './password-hasher.service';
import { ResetTokenRepository } from '../Repository/reset-token.repository';

@Injectable()
export class ResetPasswordService {
  private readonly logger = new Logger(ResetPasswordService.name);

  constructor(
    private readonly dataSource: DataSource,
    private bcryptPasswordHasher: BcryptPasswordHasher,
    private resetTokenRepository: ResetTokenRepository,
  ) {}

  async execute(newPassword: string, resetToken: string) {
    const token = await this.resetTokenRepository.findValidToken(resetToken);
    if (!token) {
      throw new UnauthorizedException('Invalid or expired reset link');
    }

    const hashedPassword = await this.bcryptPasswordHasher.hash(newPassword);

    await this.dataSource.transaction(async (manager) => {
      await manager.update(
        'user',
        { id: token.userId },
        { password: hashedPassword },
      );
      await manager.delete(ResetToken, { userId: token.userId });
    });

    this.logger.log(`Password reset successful for user ID: ${token.userId}`);
  }
}
