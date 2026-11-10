import { crearNuevoViaje, NuevoViaje, Viaje } from '../domain/viaje';
import { ViajeEnCursoDuplicadoError } from '../domain/viaje-en-curso-duplicado.error';
import { ViajesRepositoryPort } from './viajes.repository.port';

// El ciudadano sale en bicicleta: se valida la ubicacion, se comprueba que no tenga otro viaje abierto y se guarda
export class IniciarViajeUseCase {
  constructor(private readonly viajes: ViajesRepositoryPort) {}

  async execute(datos: NuevoViaje): Promise<Viaje> {
    const nuevo = crearNuevoViaje(datos);
    const enCurso = await this.viajes.buscarEnCurso(nuevo.usuarioId);
    if (enCurso !== null) {
      throw new ViajeEnCursoDuplicadoError(enCurso.id);
    }
    return this.viajes.iniciar(nuevo);
  }
}
