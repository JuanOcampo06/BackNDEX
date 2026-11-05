// Listas cerradas de valores que usa el tablero y que tambien valida el filtro

// Tipos de vehiculo de micromovilidad del filtro Vehiculo
export const TIPOS_VEHICULO = ['bicicleta', 'bicicleta_electrica', 'patineta_electrica', 'patineta', 'otro'] as const;
export type TipoVehiculo = (typeof TIPOS_VEHICULO)[number];

// Cifras que tienen tarjeta en la parte de arriba del tablero
export type Indicador = 'siniestros' | 'usuarios' | 'reportes' | 'boton_panico' | 'falsos_positivos';
