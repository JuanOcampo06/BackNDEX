import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { verificarToken } from './jwt';
import { SolicitudAutenticada } from './solicitud-autenticada';

// Deja pasar solo las peticiones con el encabezado Authorization: Bearer <token> valido
// guarda el id del ciudadano en la peticion para que el controlador lo lea con @UsuarioActual()
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(contexto: ExecutionContext): boolean {
    const peticion = contexto.switchToHttp().getRequest<SolicitudAutenticada>();
    const [tipo, token] = (peticion.headers.authorization ?? '').split(' ');
    const payload = tipo === 'Bearer' && token !== undefined ? verificarToken(token) : null;
    if (payload === null) {
      // Mismo formato de error que el resto de la api
      throw new UnauthorizedException({ codigo: 'TOKEN_INVALIDO', mensaje: 'Falta el token o no es valido' });
    }
    peticion.usuarioId = payload.sub;
    return true;
  }
}
