import { distanciaRecorrida } from '../domain/distancia';
import { duracionEntre, validarEnCurso, Viaje } from '../domain/viaje';
import { buscarViajeDelCiudadano } from './buscar-viaje-del-ciudadano';
import { ViajesRepositoryPort } from './viajes.repository.port';

// El ciudadano llega a su destino: se cierra el viaje con los metros recorridos, lo que duro y cuantos reportes envio
export class FinalizarViajeUseCase {
  constructor(
    private readonly viajes: ViajesRepositoryPort,
    // La fecha de hoy se entrega desde aqui para que las pruebas puedan fijarla
    private readonly ahora: () => Date = () => new Date(),
  ) {}

  async execute(usuarioId: number, viajeId: number): Promise<Viaje> {
    const viaje = await buscarViajeDelCiudadano(this.viajes, viajeId, usuarioId);
    validarEnCurso(viaje);
    const finalizadoEn = this.ahora().toISOString();
    return this.viajes.finalizar(viajeId, {
      finalizadoEn,
      distanciaM: distanciaRecorrida(viaje.puntos),
      duracionS: duracionEntre(viaje.iniciadoEn, finalizadoEn),
      cantidadReportes: await this.viajes.contarReportes(usuarioId, viaje.iniciadoEn, finalizadoEn),
    });
  }
}
