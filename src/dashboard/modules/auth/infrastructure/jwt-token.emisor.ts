import { Injectable } from '@nestjs/common';
import { AUDIENCIA_DASHBOARD, firmarToken } from '../../../../platform/auth';
import { TokenEmisorPort } from '../application/token-emisor.port';

// Firma el JWT del dashboard con su audiencia y el rol para que el guard pueda hacer cumplir los permisos
@Injectable()
export class JwtTokenEmisor implements TokenEmisorPort {
  emitir(usuarioId: string, rol: string): string {
    return firmarToken(Number(usuarioId), Date.now(), { aud: AUDIENCIA_DASHBOARD, rol });
  }
}
