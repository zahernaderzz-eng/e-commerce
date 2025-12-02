import { IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email: string;
  @IsString()
  name: string;

  @IsStrongPassword()
  password: string;
}
