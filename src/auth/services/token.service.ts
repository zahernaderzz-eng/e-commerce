import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../types/jwt-payload.type';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface ITokenService {
  generateTokenPair(userId: number): Promise<TokenPair>;
  verifyAccessToken(token: string): JwtPayload;
  verifyRefreshToken(token: string): JwtPayload;
}

@Injectable()
export class JwtTokenService implements ITokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExp: string;
  private readonly refreshExp: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessSecret =
      this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.refreshSecret =
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    this.accessExp = this.configService.getOrThrow<string>(
      'JWT_ACCESS_EXPIRES_IN',
    );
    this.refreshExp = this.configService.getOrThrow<string>(
      'JWT_REFRESH_EXPIRES_IN',
    );
  }

  async generateTokenPair(userId: number): Promise<TokenPair> {
    const payload: JwtPayload = { userId };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessExp as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshExp as any,
    });

    return { accessToken, refreshToken, expiresIn: this.accessExp };
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token, {
      secret: this.accessSecret,
    });
  }

  verifyRefreshToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token, {
      secret: this.refreshSecret,
    });
  }
}
