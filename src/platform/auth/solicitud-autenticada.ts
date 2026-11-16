import type { Request } from 'express';

// Peticion HTTP a la que el guard le agrega el id del ciudadano o del usuario del dashboard que saco del token
export type SolicitudAutenticada = Request & { usuarioId: number };
