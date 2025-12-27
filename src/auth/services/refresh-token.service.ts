import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { JwtTokenService } from './token.service';

@Injectable()
export class RefreshTokenService {
  constructor(
    private jwtTokenService: JwtTokenService,
    private userService: UserService,
  ) {}

  async execute(refreshToken: string) {
    try {
      const decoded =
        await this.jwtTokenService.verifyRefreshToken(refreshToken);
      const user = await this.userService.findOneBy({ id: decoded.userId });

      if (!user || user.accountStatus === 'unverified') {
        throw new UnauthorizedException('User not found or unverified');
      }

      return await this.jwtTokenService.generateTokenPair(decoded.userId);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid refresh token');
      }
      throw new UnauthorizedException('Token verification failed');
    }
  }
}
