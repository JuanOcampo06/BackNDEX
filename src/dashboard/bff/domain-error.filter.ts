import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { DomainError } from '../modules/users';

// Convierte los errores del negocio en respuestas HTTP con el mismo formato que el login
// CREDENCIALES_INVALIDAS responde 401 los codigos _NO_ENCONTRADO 404 los _DUPLICADO 409 y el resto 400
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(error: DomainError, host: ArgumentsHost): void {
    host.switchToHttp().getResponse<Response>().status(estadoDe(error.codigo)).json({ codigo: error.codigo, mensaje: error.message });
  }
}

function estadoDe(codigo: string): number {
  if (codigo === 'CREDENCIALES_INVALIDAS') return HttpStatus.UNAUTHORIZED;
  if (codigo.endsWith('_NO_ENCONTRADO')) return HttpStatus.NOT_FOUND;
  if (codigo.endsWith('_DUPLICADO')) return HttpStatus.CONFLICT;
  return HttpStatus.BAD_REQUEST;
}
