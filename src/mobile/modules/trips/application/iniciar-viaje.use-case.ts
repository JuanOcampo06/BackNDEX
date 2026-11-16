import { crearNuevoViaje, DatosViaje, Viaje } from '../domain/viaje';
import { ViajeEnCursoDuplicadoError } from '../domain/viaje-en-curso-duplicado.error';
import { ViajesRepositoryPort } from './viajes.repository.port';

// El ciudadano sale: se validan su vehiculo y su ubicacion, se comprueba que no tenga otro viaje abierto y se guarda
export class IniciarViajeUseCase {
  constructor(private readonly viajes: ViajesRepositoryPort) {}

  async execute(datos: DatosViaje): Promise<Viaje> {
    const nuevo = crearNuevoViaje(datos);
    const enCurso = await this.viajes.buscarEnCurso(nuevo.usuarioId);
    if (enCurso !== null) {
      throw new ViajeEnCursoDuplicadoError(enCurso.id);
    }
    return this.viajes.iniciar(nuevo);
  }
}
