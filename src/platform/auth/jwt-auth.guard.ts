import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AUDIENCIA_DASHBOARD, tokenDeLaPeticion } from './jwt';
import { SolicitudAutenticada } from './solicitud-autenticada';

// Deja pasar solo las peticiones con el encabezado Authorization: Bearer <token> valido
// guarda el id del ciudadano en la peticion para que el controlador lo lea con @UsuarioActual()
// un token del dashboard no sirve aqui porque su id no es el de un ciudadano
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(contexto: ExecutionContext): boolean {
    const peticion = contexto.switchToHttp().getRequest<SolicitudAutenticada>();
    const payload = tokenDeLaPeticion(peticion.headers.authorization);
    if (payload === null || payload.aud === AUDIENCIA_DASHBOARD) {
      // Mismo formato de error que el resto de la api
      throw new UnauthorizedException({ codigo: 'TOKEN_INVALIDO', mensaje: 'Falta el token o no es valido' });
    }
    peticion.usuarioId = payload.sub;
    return true;
  }
}
