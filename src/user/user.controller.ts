import { Controller, Patch, Body, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';

import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Permissions } from '../decorators/permissions.decorator';
import { Resource } from '../roles/enums/resource.enum';
import { Action } from '../roles/enums/action.enum';
import { AuthenticationGuard } from '../guards/authentication.guard';
import { AuthorizationGuard } from '../guards/authorization.guard';
import { UpdateUserRoleByEmailDto } from './dto/update-user-role-email.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthenticationGuard, AuthorizationGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch('role-by-email')
  @Permissions([
    {
      resource: Resource.users,
      actions: [Action.update],
    },
  ])
  @ApiOperation({ summary: 'Update user role using email instead of ID' })
  @ApiBody({ type: UpdateUserRoleByEmailDto })
  async updateUserRoleByEmail(@Body() dto: UpdateUserRoleByEmailDto) {
    return this.userService.updateUserRoleByEmail(dto.email, dto.roleId);
  }
}
