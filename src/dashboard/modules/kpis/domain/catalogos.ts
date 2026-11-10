// Listas cerradas de valores que usa el tablero y que tambien valida el filtro

// Tipos de vehiculo de micromovilidad del filtro Vehiculo
export const TIPOS_VEHICULO = ['bicicleta', 'bicicleta_electrica', 'patineta_electrica', 'patineta', 'otro'] as const;
export type TipoVehiculo = (typeof TIPOS_VEHICULO)[number];

// Fuentes de datos del tablero
// anuario es el anuario de siniestralidad de la secretaria de movilidad y app son los datos de la app movil
export const FUENTES = ['anuario', 'app'] as const;
export type Fuente = (typeof FUENTES)[number];

// Categorias principales de los reportes de la app
// el tablero no muestra subcategorias y en cada categoria suma todas las suyas
export const CATEGORIAS_REPORTE = ['danos_en_la_via', 'transito', 'seguridad', 'otro'] as const;

// Cifras que tienen tarjeta en la parte de arriba del tablero
export type Indicador = 'siniestros' | 'usuarios' | 'reportes' | 'boton_panico' | 'falsos_positivos';
