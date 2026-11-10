import { DomainError } from '../../../../shared/domain-error';

// El origen y el destino tienen ciclovia cerca pero ninguna conexion entre ellas
export class RutaSinCaminoError extends DomainError {
  constructor() {
    super('RUTA_SIN_CAMINO', 'No hay un camino por las ciclovias entre el origen y el destino');
  }
}
