import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  ValidateNested,
  IsEnum,
  ArrayUnique,
  IsNotEmpty,
  IsArray,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Resource } from '../enums/resource.enum';
import { Action } from '../enums/action.enum';

export class CreateRoleDto {
  @ApiProperty({
    example: 'manager',
    description: 'Role name',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: 'List of permissions',
    type: () => [Permission],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Permission)
  permissions: Permission[];
}

export class Permission {
  @ApiProperty({ enum: Resource })
  @IsEnum(Resource)
  resource: Resource;

  @ApiProperty({
    enum: Action,
    isArray: true,
    example: [Action.read, Action.update],
  })
  @IsArray()
  @IsEnum(Action, { each: true })
  @ArrayUnique()
  actions: Action[];
}
