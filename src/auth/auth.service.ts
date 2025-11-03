import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SignupDto } from './dtos/signup.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entityes/user.entity';
import { MoreThanOrEqual, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from './entityes/refresh-token.entity';
import { randomUUID } from 'crypto';

import { nanoid } from 'nanoid';
import { ResetToken } from './entityes/reset-token-entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    @InjectRepository(ResetToken) private resetToken: Repository<ResetToken>,
    @InjectRepository(RefreshToken)
    private refreshToken: Repository<RefreshToken>,
    private jwtSetvice: JwtService,
    private mailService: MailService,
  ) {}

  async signup(signupData: SignupDto) {
    const { email, password, name } = signupData;
    const emailInUse = await this.repo.findOneBy({ email });
    if (emailInUse) {
      throw new BadRequestException('Email already in use');
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.repo.create({
      name,
      email,
      password: hashedPassword,
    });

    await this.repo.save(user);
  }

  async login(credentials: LoginDto) {
    const { email, password } = credentials;
    const user = await this.repo.findOneBy({ email });
    if (!user) {
      throw new UnauthorizedException('wrong credentials');
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('wrong credentials');
    }

    return this.generateUserTokens(user.id);
  }

  async forgotPassword(email: string) {
    const user = await this.repo.findOneBy({ email });

    if (user) {
      const resetToken = nanoid(64);
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 1);

      await this.resetToken.upsert(
        {
          token: resetToken,
          expiryDate,
          userId: user.id,
        },
        ['userId'],
      );

      this.mailService.sendPasswordResetEmail(email, resetToken);
    }

    return {
      message: ' If this user exists , they will recive an email ',
    };
  }
  async resetPassword(newPassword: string, resetToken: string) {
    const token = await this.resetToken.findOne({
      where: {
        token: resetToken,
        expiryDate: MoreThanOrEqual(new Date()), // نفس فكرة $gte
      },
    });

    if (!token) {
      throw new UnauthorizedException('Invalid or expired reset link');
    }

    await this.resetToken.delete({ id: token.id });

    const user = await this.repo.findOne({ where: { id: token.userId } });
    if (!user) {
      throw new InternalServerErrorException('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await this.repo.save(user);
  }

  async refrshToken(refreshToken: string) {
    const token = await this.refreshToken.findOneBy({ token: refreshToken });
    if (!token) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (token.expiryDate <= new Date()) {
      await this.refreshToken.delete({ token: refreshToken });
      throw new UnauthorizedException('Refresh token expired');
    }
    await this.refreshToken.delete({ token: refreshToken });

    return this.generateUserTokens(token.userId);
  }

  async generateUserTokens(userId) {
    const accessToken = this.jwtSetvice.sign({ userId }, { expiresIn: '1h' });

    const refreshToken = randomUUID();

    await this.storeRefreshToken(refreshToken, userId);

    return {
      accessToken,
      refreshToken,
    };
  }

  async storeRefreshToken(token: string, userId) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 3);

    await this.refreshToken.upsert({ token, userId, expiryDate }, ['userId']);
  }

  async changePassword(userId, oldPassword: string, newPassword: string) {
    const user = await this.repo.findOneBy(userId);
    if (!user) {
      throw new NotFoundException('User not found ...?');
    }
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('wrong credentials');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;

    await this.repo.save(user);

    return { message: 'Password updated successfully' };
  }
}
