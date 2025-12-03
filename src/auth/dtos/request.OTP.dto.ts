import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ResendOtpDto {
  @ApiProperty({
    description: 'Email address to resend OTP',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;
}
