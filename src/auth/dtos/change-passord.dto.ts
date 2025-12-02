import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsStrongPassword } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Old password for user', example: 'maherM18@' })
  @IsString()
  oldPassword: string;

  @ApiProperty()
  @IsStrongPassword()
  newPassword: string;
}
