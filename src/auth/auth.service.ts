import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SignupDto } from './dtos/signup.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from './entities/refresh-token.entity';
import { randomUUID } from 'crypto';
import { nanoid } from 'nanoid';
import { ResetToken } from './entities/reset-token-entity';
import { MailService } from '../mail/mail.service';
import { OTPService } from '../otp/otp.service';
import { OTPType } from '../otp/type/OTPType';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(ResetToken) private resetToken: Repository<ResetToken>,
    @InjectRepository(RefreshToken)
    private refreshToken: Repository<RefreshToken>,
    private jwtSetvice: JwtService,
    private mailService: MailService,
    private otpService: OTPService,
    private userService: UserService,
  ) {}

  async signup(signupData: SignupDto) {
    const { email, password, name } = signupData;
    const emailInUse = await this.userService.findOneBy({ email });
    if (emailInUse) {
      throw new BadRequestException('Email already in use');
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userService.create({
      name,
      email,
      password: hashedPassword,
    });

    await this.userService.save(user);
    const otp = await this.otpService.generateOTP(user, OTPType.OTP);

    await this.mailService.sendOtpViaEmail(email, otp);
  }

  async login(credentials: LoginDto) {
    const { email, password, otp } = credentials;
    const user = await this.userService.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Wrong credentials');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Wrong credentials');
    }

    if (user.accountStatus === 'unverified') {
      if (!otp) {
        return {
          message: 'Your account is not verified. Please provide your OTP.',
        };
      }

      await this.verifyToken(user.id, otp);

      user.accountStatus = 'verified';
      await this.userService.save(user);
    }

    return this.generateUserTokens(user.id);
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findOneBy({ email });

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

    const user = await this.userService.findOne({
      where: { id: token.userId },
    });
    if (!user) {
      throw new InternalServerErrorException('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await this.userService.save(user);
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
      userId,
    };
  }

  async storeRefreshToken(token: string, userId) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 3);

    await this.refreshToken.upsert({ token, userId, expiryDate }, ['userId']);
  }

  async verifyToken(userId: number, token: string) {
    const valid = await this.otpService.validateOTP(userId, token);
    if (!valid) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.otpService.deleteOtp(userId);
    return true;
  }

  async changePassword(userId, oldPassword: string, newPassword: string) {
    const user = await this.userService.findOneBy(userId);
    if (!user) {
      throw new NotFoundException('User not found ...?');
    }
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('wrong credentials');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;

    await this.userService.save(user);

    return { message: 'Password updated successfully' };
  }

  async resendOtp(email: string) {
    const user = await this.userService.findOne({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('user not found');
    }

    if (user.accountStatus === 'verified') {
      throw new BadRequestException('Account already verified');
    }

    const otp = await this.otpService.generateOTP(user, OTPType.OTP);

    await this.mailService.sendOtpViaEmail(email, otp);

    return { message: 'A new OTP has been sent to your email.' };
  }
}
