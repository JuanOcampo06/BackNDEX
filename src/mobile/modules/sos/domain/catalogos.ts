// Estados de una activacion del boton de panico
// nace activa y despues la atienden o la cancela el ciudadano
export const ESTADOS_SOS = ['activa', 'atendida', 'cancelada'] as const;
export type EstadoSos = (typeof ESTADOS_SOS)[number];
