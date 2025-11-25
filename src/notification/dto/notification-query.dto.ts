import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class NotificationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(['all', 'read', 'unread'])
  filter?: 'all' | 'read' | 'unread' = 'all';

  @IsOptional()
  @IsEnum(['order', 'promotion', 'general', 'all'])
  type?: 'order' | 'promotion' | 'general' | 'all' = 'all';
}
