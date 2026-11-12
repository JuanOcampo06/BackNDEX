import { CREDITO_ANUARIO, CREDITO_CICLOVIAS, CreditoDeFuente } from '../domain/fuentes-de-datos';
import { TableroRepositoryPort } from './tablero.repository.port';

export type Credito = CreditoDeFuente & { fechaCorte: string | null };

export interface Creditos {
  fuentes: Credito[];
}

// Credito de cada fuente externa con su enlace oficial su licencia y su fecha de corte
// la fecha de corte es el ultimo dia con datos que tiene cargada la base
export class ObtenerCreditosUseCase {
  constructor(private readonly tablero: TableroRepositoryPort) {}

  async execute(): Promise<Creditos> {
    const fechas = await this.tablero.buscarFechasDeCorte();
    return {
      fuentes: [
        { ...CREDITO_ANUARIO, fechaCorte: fechas.anuario },
        { ...CREDITO_CICLOVIAS, fechaCorte: fechas.ciclovias },
      ],
    };
  }
}
