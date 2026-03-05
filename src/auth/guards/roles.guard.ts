import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '../roles';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    // Libera preflight CORS
    if (req.method === 'OPTIONS') return true;
    const role: Role | undefined = req.user?.role;
    if (!role) throw new ForbiddenException('Role não encontrado');

    if (!requiredRoles.includes(role)) {
      throw new ForbiddenException('Sem permissão');
    }
    return true;
  }
}

