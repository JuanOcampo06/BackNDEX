import { DomainError } from '../../../../shared/domain-error';

// El origen o el destino estan muy lejos de cualquier ciclovia y por eso no hay como calcular la ruta
export class RutaFueraDeCoberturaError extends DomainError {
  constructor(lugar: 'origen' | 'destino', alcanceM: number) {
    super('RUTA_FUERA_DE_COBERTURA', `El ${lugar} esta a mas de ${alcanceM} metros de la ciclovia mas cercana`);
  }
}
