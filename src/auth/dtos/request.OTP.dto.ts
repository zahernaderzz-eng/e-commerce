import { IsEmail, IsString } from 'class-validator';

export class RequestOTPDto {
  @IsString()
  @IsEmail()
  email: string;
}