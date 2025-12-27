import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { BcryptPasswordHasher } from './password-hasher.service';
import { JwtTokenService } from './token.service';
import { OTPService } from '../../otp/otp.service';
import { LoginDto } from '../dtos/login.dto';
import { AccountStatus } from '../../user/enums/account.status.enum';
import { User } from '../../user/entities/user.entity';

@Injectable()
export class LoginService {
  constructor(
    private userService: UserService,
    private bcryptPasswordHasher: BcryptPasswordHasher,
    private jwtTokenService: JwtTokenService,
    private otpService: OTPService,
  ) {}

  async execute(credentials: LoginDto) {
    const user = await this.validateCredentials(credentials);

    if (user.accountStatus === AccountStatus.UNVERIFIED) {
      return await this.handleUnverifiedAccount(user, credentials.otp);
    }

    return await this.generateLoginResponse(user);
  }

  private async validateCredentials(credentials: LoginDto) {
    const user = await this.userService.findOne({
      where: { email: credentials.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await this.bcryptPasswordHasher.compare(
      credentials.password,
      user.password,
    );

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  private async handleUnverifiedAccount(user: User, otp?: string) {
    if (!otp) {
      return {
        message: 'Account verification required',
        status: 'UNVERIFIED',
      };
    }

    await this.otpService.validateOTP(user.id, otp);
    user.accountStatus = AccountStatus.VERIFIED;
    await this.userService.save(user);

    return await this.generateLoginResponse(user);
  }

  private async generateLoginResponse(user: User) {
    const tokens = await this.jwtTokenService.generateTokenPair(user.id);

    return {
      message: 'Login successful',
      status: 'VERIFIED',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      ...tokens,
    };
  }
}
