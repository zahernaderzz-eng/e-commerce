import { IsString } from 'class-validator';

export class DeleteTokenDto {
  @IsString()
  deviceToken: string;
}
