import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { DomainError } from '../modules/reports';

const ESTADO_NO_ENCONTRADO = 404;
const ESTADO_PETICION_INVALIDA = 400;

// Convierte los errores del negocio en respuestas HTTP con el mismo formato que usa el login del dashboard
// los codigos que terminan en _NO_ENCONTRADO responden 404 y el resto 400
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(error: DomainError, host: ArgumentsHost): void {
    const estado = error.codigo.endsWith('_NO_ENCONTRADO') ? ESTADO_NO_ENCONTRADO : ESTADO_PETICION_INVALIDA;
    host.switchToHttp().getResponse<Response>().status(estado).json({ codigo: error.codigo, mensaje: error.message });
  }
}
