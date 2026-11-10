// Tipos de vehiculo que el ciudadano elige en la app al reportar o al activar el boton de panico
// son los mismos del filtro Vehiculo del dashboard para poder filtrar sus graficas
export const TIPOS_VEHICULO = ['bicicleta', 'bicicleta_electrica', 'patineta_electrica', 'patineta', 'otro'] as const;
export type TipoVehiculo = (typeof TIPOS_VEHICULO)[number];

export function esTipoVehiculo(valor: string): valor is TipoVehiculo {
  return (TIPOS_VEHICULO as readonly string[]).includes(valor);
}
