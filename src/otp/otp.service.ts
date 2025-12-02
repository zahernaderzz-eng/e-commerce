import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OTP } from './entities/otp.entity';
import { EntityManager, MoreThan, Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { OTPType } from './type/OTPType';
import { User } from '../user/entities/user.entity';

@Injectable()
export class OTPService {
  constructor(
    @InjectRepository(OTP)
    private otpRepository: Repository<OTP>,
  ) {}

  async generateOTP(user: User, type: OTPType) {
    // generate 6 digit otp
    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOTP = await bcrypt.hash(otp, 10);
    const now = new Date();
    const expireAt = new Date(now.getTime() + 5 * 60 * 1000);

    //check if otp already exists for that user
    const existingOTP = await this.otpRepository.findOne({
      where: { user: { id: user.id }, type },
    });

    if (existingOTP) {
      //update exisiting token
      existingOTP.token = hashedOTP;
      existingOTP.expireAt = expireAt;
      await this.otpRepository.save(existingOTP);
    } else {
      //create otp entity
      const otpEntity = this.otpRepository.create({
        user,
        token: hashedOTP,
        createdAt: now,
        type,
        expireAt,
      });

      await this.otpRepository.save(otpEntity);
    }
    return otp;
  }

  async validateOTP(userId: number, token: string) {
    const validToken = await this.otpRepository.findOne({
      where: {
        user: { id: userId },
        expireAt: MoreThan(new Date()),
      },
    });

    if (!validToken) {
      throw new BadRequestException('OTP expired, request a new one');
    }

    const isMatch = await bcrypt.compare(token, validToken.token);
    if (!isMatch) {
      throw new BadRequestException('OTP is invalid, please try again');
    }

    return true;
  }

  async deleteOtp(userId: number) {
    await this.otpRepository.delete({ user: { id: userId } });
  }

  async generateOTPWithManager(
    manager: EntityManager,
    user: User,
    type: OTPType,
  ) {
    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOTP = await bcrypt.hash(otp, 10);
    const now = new Date();
    const expireAt = new Date(now.getTime() + 5 * 60 * 1000);

    const existingOTP = await manager.findOne(OTP, {
      where: { user: { id: user.id }, type },
    });

    if (existingOTP) {
      existingOTP.token = hashedOTP;
      existingOTP.expireAt = expireAt;
      await manager.save(OTP, existingOTP);
    } else {
      const otpEntity = manager.create(OTP, {
        user,
        token: hashedOTP,
        createdAt: now,
        type,
        expireAt,
      });

      await manager.save(OTP, otpEntity);
    }

    return otp;
  }
}
