import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userService: UserService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    console.log('INSIDE AUTHOR GUARD');
    const request = context.switchToHttp().getRequest();

    if (!request.userId) {
      throw new UnauthorizedException('User id not found');
    }

    const routePermissions = this.reflector.getAllAndOverride(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!routePermissions) {
      return true;
    }

    try {
      const userPermissions = await this.userService.getUserPermission(
        request.userId,
      );

      for (const routePermission of routePermissions) {
        const userPermission = userPermissions.find(
          (perm) => perm.resource === routePermission.resource,
        );

        if (!userPermission) throw new ForbiddenException();

        const allActionsAvailable = routePermission.actions.every(
          (requiredAction) => userPermission.actions.includes(requiredAction),
        );
        if (!allActionsAvailable) throw new ForbiddenException();
      }
    } catch (e) {
      throw new ForbiddenException();
    }

    return true;
  }
}
