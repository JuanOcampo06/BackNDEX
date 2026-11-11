import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AUDIENCIA_DASHBOARD, tokenDeLaPeticion } from './jwt';

const CLAVE_ROLES = 'roles-permitidos';

// Marca un endpoint o un controlador para que solo lo usen estos roles
// sin esta marca basta con tener un token valido del dashboard
export const SoloRoles = (...roles: string[]) => SetMetadata(CLAVE_ROLES, roles);

// Protege los endpoints del dashboard
// sin token o con un token invalido vencido o de la app movil responde 401
// con un token valido pero sin el rol pedido responde 403
@Injectable()
export class DashboardAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const payload = tokenDeLaPeticion(contexto.switchToHttp().getRequest<Request>().headers.authorization);
    if (payload === null || payload.aud !== AUDIENCIA_DASHBOARD) {
      throw new UnauthorizedException({ codigo: 'TOKEN_INVALIDO', mensaje: 'Falta el token o no es valido' });
    }
    const permitidos = this.reflector.getAllAndOverride<string[] | undefined>(CLAVE_ROLES, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    if (permitidos !== undefined && !permitidos.includes(payload.rol ?? '')) {
      throw new ForbiddenException({
        codigo: 'ACCESO_DENEGADO',
        mensaje: 'Tu rol no tiene permiso para esta accion: solo el Administrador puede usarla',
      });
    }
    return true;
  }
}
