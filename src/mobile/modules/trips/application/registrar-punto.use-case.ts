import { PuntoViaje, Ubicacion, validarEnCurso, validarUbicacion } from '../domain/viaje';
import { buscarViajeDelCiudadano } from './buscar-viaje-del-ciudadano';
import { ViajesRepositoryPort } from './viajes.repository.port';

// El telefono envia un punto GPS del recorrido mientras el viaje sigue en curso
export class RegistrarPuntoUseCase {
  constructor(private readonly viajes: ViajesRepositoryPort) {}

  async execute(usuarioId: number, viajeId: number, ubicacion: Ubicacion): Promise<PuntoViaje> {
    const punto = validarUbicacion(ubicacion);
    validarEnCurso(await buscarViajeDelCiudadano(this.viajes, viajeId, usuarioId));
    return this.viajes.agregarPunto(viajeId, punto);
  }
}
