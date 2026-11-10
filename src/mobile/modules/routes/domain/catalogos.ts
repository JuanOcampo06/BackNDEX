// Tipos de ruta que la app le ofrece al ciudadano y en el mismo orden en que los muestra
// rapida es la que menos tarda, segura la que mas evita los tramos peligrosos
// y equilibrada la que reparte el peso entre las dos cosas
export const CRITERIOS_RUTA = ['segura', 'equilibrada', 'rapida'] as const;
export type CriterioRuta = (typeof CRITERIOS_RUTA)[number];

// Niveles de riesgo de una ciclovia y mientras no se calculen la ciclovia llega sin riesgo
export const RIESGOS = ['bajo', 'medio', 'alto'] as const;
export type Riesgo = (typeof RIESGOS)[number];

// Tipos de tramo por los que pasa una ruta
// ciclovia y cruce vienen de OpenStreetMap y conexion es un enlace por calle normal entre dos ciclovias cercanas
export const TIPOS_TRAMO = ['ciclovia', 'cruce', 'conexion'] as const;
export type TipoTramo = (typeof TIPOS_TRAMO)[number];

// Maniobras que la app puede mostrar a lo largo de la ruta
export const TIPOS_PASO = ['salida', 'derecha', 'izquierda', 'giro_en_u', 'llegada'] as const;
export type TipoPaso = (typeof TIPOS_PASO)[number];
