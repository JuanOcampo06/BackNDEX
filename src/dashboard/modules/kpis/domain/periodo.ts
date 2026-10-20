import { DomainError } from '../../../../shared/domain-error';

const MESES_POR_ANIO = 12;
const MESES_POR_DEFECTO = 3;
const FORMATO_MES = /^(\d{4})-(0[1-9]|1[0-2])$/;

// Rango de meses completos que se consulta en el tablero
export class Periodo {
  // Cada mes se guarda como un numero continuo para sumar y restar meses sin lios
  private constructor(
    private readonly inicio: number,
    private readonly fin: number,
  ) {
    if (inicio > fin) {
      throw new DomainError('PERIODO_INVALIDO', 'El mes inicial no puede ser posterior al mes final');
    }
  }

  // Si no llega el mes final se usa el mes de hoy y si no llega el inicial se toman tres meses hacia atras
  static desdeFiltro(hoy: Date, mesDesde?: string, mesHasta?: string): Periodo {
    const fin = mesHasta ? aIndice(mesHasta) : hoy.getFullYear() * MESES_POR_ANIO + hoy.getMonth();
    const inicio = mesDesde ? aIndice(mesDesde) : fin - MESES_POR_DEFECTO + 1;
    return new Periodo(inicio, fin);
  }

  get cantidadMeses(): number {
    return this.fin - this.inicio + 1;
  }

  get anioFinal(): number {
    return Math.floor(this.fin / MESES_POR_ANIO);
  }

  // Mismo numero de meses justo antes de este periodo para comparar
  anterior(): Periodo {
    return new Periodo(this.inicio - this.cantidadMeses, this.inicio - 1);
  }

  // Periodo de la cantidad de meses pedida que termina en el mismo mes final
  ultimosMeses(cantidad: number): Periodo {
    return new Periodo(this.fin - cantidad + 1, this.fin);
  }

  // Desde enero del anio anterior hasta diciembre del anio del mes final
  aniosDeComparacion(): Periodo {
    const eneroAnioAnterior = (this.anioFinal - 1) * MESES_POR_ANIO;
    return new Periodo(eneroAnioAnterior, eneroAnioAnterior + 2 * MESES_POR_ANIO - 1);
  }

  // Primer dia del periodo con formato AAAA-MM-DD
  fechaInicio(): string {
    return `${aTextoMes(this.inicio)}-01`;
  }

  // Primer dia del mes siguiente al final y por eso no se incluye en la consulta
  fechaFinExclusiva(): string {
    return `${aTextoMes(this.fin + 1)}-01`;
  }

  // Lista de meses del periodo con formato AAAA-MM
  meses(): string[] {
    return Array.from({ length: this.cantidadMeses }, (_, posicion) => aTextoMes(this.inicio + posicion));
  }
}

function aIndice(mes: string): number {
  const partes = FORMATO_MES.exec(mes);
  if (!partes) {
    throw new DomainError('MES_INVALIDO', `El mes ${mes} debe tener formato AAAA-MM`);
  }
  return Number(partes[1]) * MESES_POR_ANIO + Number(partes[2]) - 1;
}

function aTextoMes(indice: number): string {
  const anio = Math.floor(indice / MESES_POR_ANIO);
  const mes = (indice % MESES_POR_ANIO) + 1;
  return `${anio}-${String(mes).padStart(2, '0')}`;
}
