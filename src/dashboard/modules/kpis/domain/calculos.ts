import { DomainError } from '../../../../shared/domain-error';

const CIEN = 100;
const UN_DECIMAL = 10;
const HORAS_DEL_DIA = 24;
const HORAS_POR_FRANJA = 6;

export type Franja = 'madrugada' | 'manana' | 'tarde' | 'noche';
const FRANJAS: readonly Franja[] = ['madrugada', 'manana', 'tarde', 'noche'];

// Rangos de edad de la grafica de siniestros por sexo y edad
const RANGOS_EDAD = [
  { etiqueta: '0-17', edadMaxima: 17 },
  { etiqueta: '18-25', edadMaxima: 25 },
  { etiqueta: '26-35', edadMaxima: 35 },
  { etiqueta: '36-45', edadMaxima: 45 },
  { etiqueta: '46-60', edadMaxima: 60 },
  { etiqueta: '60+', edadMaxima: Infinity },
] as const;
export type RangoEdad = (typeof RANGOS_EDAD)[number]['etiqueta'];
export const ETIQUETAS_RANGO_EDAD: readonly RangoEdad[] = RANGOS_EDAD.map((rango) => rango.etiqueta);

function redondear(valor: number): number {
  return Math.round(valor * UN_DECIMAL) / UN_DECIMAL;
}

// Suma el total de una lista de conteos
export function sumarTotales(conteos: readonly { total: number }[]): number {
  return conteos.reduce((suma, conteo) => suma + conteo.total, 0);
}

// Porcentaje con un decimal y cero cuando no hay total
export function porcentaje(parte: number, total: number): number {
  return total === 0 ? 0 : redondear((parte / total) * CIEN);
}

// Cambio contra el periodo anterior y null cuando antes no habia datos para comparar
export function variacionPorcentual(actual: number, anterior: number): number | null {
  return anterior === 0 ? null : redondear(((actual - anterior) / anterior) * CIEN);
}

// Madrugada de 0 a 6 manana de 6 a 12 tarde de 12 a 18 y noche de 18 a 24
export function franjaDeHora(hora: number): Franja {
  if (!Number.isInteger(hora) || hora < 0 || hora >= HORAS_DEL_DIA) {
    throw new DomainError('HORA_INVALIDA', `La hora ${hora} no existe`);
  }
  return FRANJAS[Math.floor(hora / HORAS_POR_FRANJA)];
}

// Devuelve la etiqueta del rango al que pertenece una edad
export function rangoDeEdad(edad: number): RangoEdad {
  const rango = RANGOS_EDAD.find((candidato) => edad <= candidato.edadMaxima);
  if (!rango || edad < 0) {
    throw new DomainError('EDAD_INVALIDA', `La edad ${edad} no es valida`);
  }
  return rango.etiqueta;
}
