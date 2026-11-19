import { applyDecorators, HttpException, HttpStatus, Injectable, UseGuards } from '@nestjs/common';
import { hours, minutes, Throttle, ThrottlerGuard } from '@nestjs/throttler';

// Limite de intentos por IP para frenar la fuerza bruta en el login y la creacion masiva de cuentas
// los contadores viven en memoria porque la api corre en una sola instancia
const INTENTOS_DE_LOGIN = 5;
const REGISTROS_POR_HORA = 3;

// Responde 429 con el mismo formato { codigo, mensaje } que el resto de la api
@Injectable()
export class LimiteIntentosGuard extends ThrottlerGuard {
  protected async throwThrottlingException(): Promise<void> {
    throw new HttpException(
      { codigo: 'DEMASIADOS_INTENTOS', mensaje: 'Demasiados intentos, espera un momento y vuelve a intentarlo' },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

// Para los endpoints de inicio de sesion: 5 intentos por minuto por IP
export const LimiteLogin = () =>
  applyDecorators(UseGuards(LimiteIntentosGuard), Throttle({ default: { limit: INTENTOS_DE_LOGIN, ttl: minutes(1) } }));

// Para el registro de cuentas: 3 registros por hora por IP
export const LimiteRegistro = () =>
  applyDecorators(UseGuards(LimiteIntentosGuard), Throttle({ default: { limit: REGISTROS_POR_HORA, ttl: hours(1) } }));
