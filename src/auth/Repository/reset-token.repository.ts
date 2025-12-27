import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { nanoid } from 'nanoid';
import { ResetToken } from './entities/reset-token-entity';

export interface IResetTokenRepository {
  findValidToken(token: string): Promise<ResetToken | null>;
  findRecentTokenByUserId(userId: number): Promise<ResetToken | null>;
  deleteByUserId(userId: number): Promise<void>;
  isRateLimited(userId: number): Promise<boolean>;
  createTokenIfAllowed(userId: number): Promise<string | null>;
}

@Injectable()
export class ResetTokenRepository implements IResetTokenRepository {
  private readonly TOKEN_LENGTH = 64;
  private readonly DEFAULT_EXPIRY_HOURS = 1;
  private readonly RATE_LIMIT_MINUTES = 5;

  constructor(
    @InjectRepository(ResetToken)
    private readonly repository: Repository<ResetToken>,
  ) {}

  async isRateLimited(userId: number): Promise<boolean> {
    const recentToken = await this.findRecentTokenByUserId(userId);

    if (!recentToken) {
      return false;
    }

    const ONE_HOUR_MS = 3600000;
    const RATE_LIMIT_MS = this.RATE_LIMIT_MINUTES * 60 * 1000;

    const createdAt = recentToken.expiryDate.getTime() - ONE_HOUR_MS;
    const timeSinceCreation = Date.now() - createdAt;

    return timeSinceCreation < RATE_LIMIT_MS;
  }

  async createTokenIfAllowed(userId: number): Promise<string | null> {
    const isLimited = await this.isRateLimited(userId);

    if (isLimited) {
      return null; // Rate limited
    }

    return this.createToken(userId);
  }

  async createToken(userId: number, expiryHours = this.DEFAULT_EXPIRY_HOURS) {
    // Delete existing tokens first
    await this.deleteByUserId(userId);

    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + expiryHours);

    const token = nanoid(this.TOKEN_LENGTH);

    const resetToken = this.repository.create({
      token: token,
      expiryDate,
      userId,
    });

    await this.repository.save(resetToken);

    return token;
  }

  async findValidToken(token: string): Promise<ResetToken | null> {
    return this.repository.findOne({
      where: {
        token,
        expiryDate: MoreThanOrEqual(new Date()),
      },
      relations: ['user'],
    });
  }

  async findRecentTokenByUserId(userId: number): Promise<ResetToken | null> {
    return this.repository.findOne({
      where: {
        userId,
        expiryDate: MoreThanOrEqual(new Date()),
      },
      order: { id: 'DESC' },
    });
  }

  async deleteByUserId(userId: number): Promise<void> {
    await this.repository.delete({ userId });
  }
}
