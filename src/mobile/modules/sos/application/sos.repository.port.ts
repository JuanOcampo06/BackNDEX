import { ActivacionSos, NuevaActivacionSos } from '../domain/activacion-sos';
import { EstadoSos } from '../domain/catalogos';

export const SOS_REPOSITORY = Symbol('SOS_REPOSITORY');

// Filtros opcionales para listar activaciones
export interface FiltrosSos {
  usuarioId?: number;
  estado?: EstadoSos;
}

// Puerto que el modulo necesita para guardar y leer activaciones sin saber de que base de datos vienen
export interface SosRepositoryPort {
  existeUsuario(usuarioId: number): Promise<boolean>;
  guardar(activacion: NuevaActivacionSos): Promise<ActivacionSos>;
  listar(filtros: FiltrosSos): Promise<ActivacionSos[]>;
  buscarPorId(id: number): Promise<ActivacionSos | null>;
  cambiarEstado(id: number, estado: EstadoSos): Promise<ActivacionSos>;
}
