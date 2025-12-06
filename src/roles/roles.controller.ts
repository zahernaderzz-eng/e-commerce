import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dtos/role.dto';
import { AuthenticationGuard } from '../guards/authentication.guard';
import { AuthorizationGuard } from '../guards/authorization.guard';
import { Permissions } from '../decorators/permissions.decorator';
import { Resource } from '../roles/enums/resource.enum';
import { Action } from '../roles/enums/action.enum';
import { UpdateRoleDto } from './dtos/update.role.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@UseGuards(AuthenticationGuard, AuthorizationGuard)
@ApiTags('Roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions([
    {
      resource: Resource.users,
      actions: [Action.read],
    },
  ])
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({
    status: 200,
    description: 'List of all roles returned successfully',
  })
  async getAllRoles() {
    return this.rolesService.getAllRoles();
  }

  @Get(':id')
  @Permissions([
    {
      resource: Resource.users,
      actions: [Action.read],
    },
  ])
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role returned successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async getRoleById(@Param('id') id: string) {
    return this.rolesService.getRoleById(id);
  }

  @Post()
  @Permissions([
    {
      resource: Resource.users,
      actions: [Action.create],
    },
  ])
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new role' })
  @ApiBody({ type: CreateRoleDto })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.createRole(createRoleDto);
  }

  @Patch(':id')
  @Permissions([
    {
      resource: Resource.users,
      actions: [Action.update],
    },
  ])
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update role' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiBody({ type: UpdateRoleDto })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.updateRole(id, updateRoleDto);
  }

  @Delete(':id')
  @Permissions([
    {
      resource: Resource.users,
      actions: [Action.delete],
    },
  ])
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete role' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async deleteRole(@Param('id') id: string) {
    return this.rolesService.deleteRole(id);
  }
}
