import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { BcryptPasswordHasher } from './password-hasher.service';
import { JwtTokenService } from './token.service';
import { ChangePasswordDto } from '../dtos/change-passord.dto';

@Injectable()
export class PasswordChangeService {
  constructor(
    private readonly userService: UserService,
    private readonly bcryptPasswordHasher: BcryptPasswordHasher,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  async execute(dto: ChangePasswordDto, userId: number) {
    const { oldPassword, newPassword } = dto;

    const user = await this.userService.findOne({
      where: { id: userId },
      select: ['id', 'email', 'password'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordMatch = await this.bcryptPasswordHasher.compare(
      oldPassword,
      user.password,
    );

    if (!passwordMatch) {
      throw new UnauthorizedException('Wrong credentials');
    }

    const samePassword = await this.bcryptPasswordHasher.compare(
      newPassword,
      user.password,
    );

    if (samePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const hashedNewPassword = await this.bcryptPasswordHasher.hash(newPassword);
    user.password = hashedNewPassword;

    await this.userService.save(user);

    const tokens = await this.jwtTokenService.generateTokenPair(userId);

    return {
      message: 'Password updated successfully',
      tokens,
    };
  }
}
