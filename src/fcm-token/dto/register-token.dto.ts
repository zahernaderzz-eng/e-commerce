import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// register-token.dto.ts
export class RegisterTokenDto {
  @IsString()
  @IsNotEmpty()
  deviceToken: string;

  @IsOptional()
  @IsIn(['android', 'ios', 'web'])
  platform?: 'android' | 'ios' | 'web';
}
