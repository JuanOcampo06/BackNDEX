// Estados de un viaje en bicicleta
// nace en curso y termina finalizado cuando el ciudadano lo cierra
export const ESTADOS_VIAJE = ['en_curso', 'finalizado'] as const;
export type EstadoViaje = (typeof ESTADOS_VIAJE)[number];
