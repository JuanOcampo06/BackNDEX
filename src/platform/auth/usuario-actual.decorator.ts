import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SolicitudAutenticada } from './solicitud-autenticada';

// Entrega al controlador el id del dueno del token
// solo se usa en rutas con JwtAuthGuard o DashboardAuthGuard
export const UsuarioActual = createParamDecorator(
  (_dato: unknown, contexto: ExecutionContext): number => contexto.switchToHttp().getRequest<SolicitudAutenticada>().usuarioId,
);
