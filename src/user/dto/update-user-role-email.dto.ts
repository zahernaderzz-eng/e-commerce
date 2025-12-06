import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsUUID } from 'class-validator';

export class UpdateUserRoleByEmailDto {
  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'f18c1d3c-2525-4b3e-bfd8-8cd3eae3c444' })
  @IsUUID()
  roleId: string;
}
