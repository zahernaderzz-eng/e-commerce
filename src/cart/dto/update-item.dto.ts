import { IsInt, IsPositive, Min } from 'class-validator';

export class UpdateItemDto {
  @IsInt()
  @Min(1)
  quantity: number;
}
