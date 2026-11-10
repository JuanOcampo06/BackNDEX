import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { DomainError } from '../modules/reports';

const ESTADO_NO_AUTORIZADO = 401;
const ESTADO_NO_ENCONTRADO = 404;
const ESTADO_DUPLICADO = 409;
const ESTADO_PETICION_INVALIDA = 400;

// Convierte los errores del negocio en respuestas HTTP con el mismo formato que usa el login del dashboard
// CREDENCIALES_INVALIDAS responde 401 los _NO_ENCONTRADO 404 los _DUPLICADO 409 y el resto 400
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(error: DomainError, host: ArgumentsHost): void {
    host.switchToHttp().getResponse<Response>().status(estadoDe(error.codigo)).json({ codigo: error.codigo, mensaje: error.message });
  }
}

function estadoDe(codigo: string): number {
  if (codigo === 'CREDENCIALES_INVALIDAS') return ESTADO_NO_AUTORIZADO;
  if (codigo.endsWith('_NO_ENCONTRADO')) return ESTADO_NO_ENCONTRADO;
  if (codigo.endsWith('_DUPLICADO')) return ESTADO_DUPLICADO;
  return ESTADO_PETICION_INVALIDA;
}
