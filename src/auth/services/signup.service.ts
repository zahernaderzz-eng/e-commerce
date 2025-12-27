import { ConflictException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserService } from '../../user/user.service';
import { OTPService } from '../../otp/otp.service';
import { BcryptPasswordHasher } from './password-hasher.service';
import { EmailQueueService } from '../../mail/email-queue.service';
import { SignupDto } from '../dtos/signup.dto';
import { OTPType } from '../../otp/type/OTPType';
import { Role } from '../../roles/entities/role.entity';
import { User } from '../../user/entities/user.entity';

@Injectable()
export class SignupService {
  constructor(
    private readonly dataSource: DataSource,
    private userService: UserService,
    private otpService: OTPService,
    private bcryptPasswordHasher: BcryptPasswordHasher,
    private emailQueue: EmailQueueService,
  ) {}

  async execute(signupData: SignupDto): Promise<void> {
    await this.validateEmailNotInUse(signupData.email);

    const hashedPassword = await this.bcryptPasswordHasher.hash(
      signupData.password,
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await this.createUser(queryRunner, {
        ...signupData,
        hashedPassword,
      });

      const otp = await this.otpService.generateOTPWithManager(
        queryRunner.manager,
        user,
        OTPType.OTP,
      );

      await this.emailQueue.sendOtp({ to: signupData.email, otp });
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async validateEmailNotInUse(email: string) {
    const existingUser = await this.userService.findOneBy({ email });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }
  }

  private async createUser(queryRunner, data) {
    const defaultRole = await queryRunner.manager.findOne(Role, {
      where: { name: 'customer' },
    });

    if (!defaultRole) {
      throw new Error('Default role not found');
    }

    const user = queryRunner.manager.create(User, {
      name: data.name,
      email: data.email,
      password: data.hashedPassword,
      phone: data.phone,
      address: data.address,
      roleId: defaultRole.id,
    });

    return await queryRunner.manager.save(User, user);
  }
}
