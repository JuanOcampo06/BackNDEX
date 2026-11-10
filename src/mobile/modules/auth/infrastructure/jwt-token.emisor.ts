import { Injectable } from '@nestjs/common';
import { firmarToken } from '../../../../platform/auth';
import { TokenEmisorPort } from '../application/token-emisor.port';

// Emite el JWT del ciudadano con la herramienta de platform/auth
@Injectable()
export class JwtTokenEmisor implements TokenEmisorPort {
  emitir(ciudadanoId: number): string {
    return firmarToken(ciudadanoId);
  }
}
