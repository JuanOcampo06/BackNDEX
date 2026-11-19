import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CONSULTA_ACCESO_DASHBOARD } from './consulta-acceso-dashboard';
import type { ConsultaAccesoDashboard } from './consulta-acceso-dashboard';
import { AUDIENCIA_DASHBOARD, tokenDeLaPeticion } from './jwt';
import { SolicitudAutenticada } from './solicitud-autenticada';

const CLAVE_ROLES = 'roles-permitidos';
const CLAVE_SIN_CAMBIAR_CONTRASENA = 'permitido-sin-cambiar-contrasena';

// Marca un endpoint o un controlador para que solo lo usen estos roles
// sin esta marca basta con tener un token valido del dashboard
export const SoloRoles = (...roles: string[]) => SetMetadata(CLAVE_ROLES, roles);

// Marca los pocos endpoints que puede usar quien todavia debe cambiar su contrasena
// por ejemplo ver su perfil y cambiar la contrasena
export const PermitidoSinCambiarContrasena = () => SetMetadata(CLAVE_SIN_CAMBIAR_CONTRASENA, true);

// Protege los endpoints del dashboard
// sin token o con un token invalido vencido o de la app movil responde 401
// si el usuario del token ya fue eliminado tambien responde 401
// si su contrasena la puso otra persona y aun no la cambia responde 403 salvo en los endpoints marcados con @PermitidoSinCambiarContrasena()
// con un token valido pero sin el rol pedido responde 403
// el estado se lee de la base en cada peticion y no del token para que eliminar un usuario o quitarle un rol aplique de inmediato
// guarda el id del usuario en la peticion para que el controlador lo lea con @UsuarioActual()
@Injectable()
export class DashboardAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(CONSULTA_ACCESO_DASHBOARD) private readonly acceso: ConsultaAccesoDashboard,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const peticion = contexto.switchToHttp().getRequest<SolicitudAutenticada>();
    const payload = tokenDeLaPeticion(peticion.headers.authorization);
    if (payload === null || payload.aud !== AUDIENCIA_DASHBOARD) {
      throw tokenInvalido();
    }
    const estado = await this.acceso.estadoActual(payload.sub);
    if (estado === null) {
      throw tokenInvalido();
    }
    if (estado.debeCambiarContrasena && !this.leerMarca<boolean>(CLAVE_SIN_CAMBIAR_CONTRASENA, contexto)) {
      throw new ForbiddenException({
        codigo: 'CAMBIO_CONTRASENA_REQUERIDO',
        mensaje: 'Debes cambiar tu contraseña antes de continuar',
      });
    }
    const permitidos = this.leerMarca<string[]>(CLAVE_ROLES, contexto);
    if (permitidos !== undefined && !permitidos.includes(estado.rol)) {
      throw new ForbiddenException({
        codigo: 'ACCESO_DENEGADO',
        mensaje: 'Tu rol no tiene permiso para esta accion: solo el Administrador puede usarla',
      });
    }
    peticion.usuarioId = payload.sub;
    return true;
  }

  // Lo que se marco en el endpoint vale mas que lo que se marco en el controlador
  private leerMarca<T>(clave: string, contexto: ExecutionContext): T | undefined {
    return this.reflector.getAllAndOverride<T | undefined>(clave, [contexto.getHandler(), contexto.getClass()]);
  }
}

// Mismo mensaje para token malo y usuario eliminado asi no se revela cual de los dos fallo
function tokenInvalido(): UnauthorizedException {
  return new UnauthorizedException({ codigo: 'TOKEN_INVALIDO', mensaje: 'Falta el token o no es valido' });
}
