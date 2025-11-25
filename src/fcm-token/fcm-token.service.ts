import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { FcmToken } from './entities/fcm-token.entity';
import { RegisterTokenDto } from './dto/register-token.dto';
import { DeleteTokenDto } from './dto/delete-token.dto';

@Injectable()
export class FcmTokenService {
  private readonly logger = new Logger(FcmTokenService.name);
  constructor(
    @InjectRepository(FcmToken)
    private readonly fcmRepo: Repository<FcmToken>,
  ) {}

  async registerToken(userId: number, dto: RegisterTokenDto) {
    const existingToken = await this.fcmRepo.findOne({
      where: { deviceToken: dto.deviceToken },
    });

    if (existingToken) {
      existingToken.platform = dto.platform || existingToken.platform;
      existingToken.userId = String(userId);
      existingToken.isActive = true;
      existingToken.lastUsedAt = new Date();
      return this.fcmRepo.save(existingToken);
    }

    if (dto.platform) {
      await this.fcmRepo.update(
        { userId: String(userId), platform: dto.platform },
        { isActive: false },
      );
    }

    // Create new token
    const newToken = this.fcmRepo.create({
      userId: String(userId),
      deviceToken: dto.deviceToken,
      platform: dto.platform,
      isActive: true,
      lastUsedAt: new Date(),
    });

    return this.fcmRepo.save(newToken);
  }

  async deactivateToken(userId: number, dto: DeleteTokenDto) {
    const token = await this.fcmRepo.findOne({
      where: {
        deviceToken: dto.deviceToken,
        userId: String(userId),
      },
    });

    if (!token) {
      throw new NotFoundException('Token not found');
    }

    token.isActive = false;
    await this.fcmRepo.save(token);

    return { success: true, message: 'Token deactivated successfully' };
  }

  async deleteInactiveTokens(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return this.fcmRepo.delete({
      isActive: false,
      updatedAt: LessThan(cutoffDate),
    });
  }

  async deleteToken(userId: number, dto: DeleteTokenDto) {
    const token = await this.fcmRepo.findOne({
      where: {
        deviceToken: dto.deviceToken,
        userId: String(userId),
      },
    });

    if (!token) return { success: false, message: 'Token not found' };

    await this.fcmRepo.delete({ id: token.id });

    return { success: true, message: 'Token deleted successfully' };
  }

  async getTokensByUser(userId: number) {
    return this.fcmRepo.find({ where: { userId: String(userId) } });
  }

  async getActiveTokensByUser(userId: number): Promise<string[]> {
    const tokens = await this.fcmRepo.find({
      where: {
        userId: String(userId),
        isActive: true,
      },
      select: ['deviceToken'],
    });

    return tokens.map((t) => t.deviceToken);
  }

  async markTokenAsInvalid(deviceToken: string) {
    await this.fcmRepo.update({ deviceToken }, { isActive: false });
  }

  async removeInvalidTokens(invalidTokens: string[]) {
    if (invalidTokens.length === 0) return;

    await this.fcmRepo.update(
      { deviceToken: In(invalidTokens) },
      { isActive: false },
    );
  }
  async getAllActiveTokens(): Promise<string[]> {
    try {
      const tokens = await this.fcmRepo.find({
        where: {
          isActive: true,
        },
        select: ['deviceToken'],
      });

      const tokenStrings = tokens.map((t) => t.deviceToken);

      this.logger.log(`Found ${tokenStrings.length} active tokens in system`);

      return tokenStrings;
    } catch (error) {
      this.logger.error(`Failed to get all active tokens: ${error.message}`);
      throw error;
    }
  }
}
