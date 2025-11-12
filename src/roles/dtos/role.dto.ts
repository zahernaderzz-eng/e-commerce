import { Type } from 'class-transformer';
import { IsString, ValidateNested, IsEnum, ArrayUnique } from 'class-validator';
import { Resource } from '../enums/resource.enum';
import { Action } from '../enums/action.enum';

export class CreateRoleDto {
  @IsString()
  name: string;

  @ValidateNested()
  @Type(() => Permission)
  permissions: Permission[];
}

export class Permission {
  @IsEnum(Resource)
  resource: Resource;

  @IsEnum(Action, { each: true })
  @ArrayUnique()
  actions: Action[];
}
