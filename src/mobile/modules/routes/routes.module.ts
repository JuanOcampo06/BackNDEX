import { Module } from '@nestjs/common';
import { CalcularRutasUseCase } from './application/calcular-rutas.use-case';
import { RED_CICLOVIAS_REPOSITORY, RedCicloviasRepositoryPort } from './application/red-ciclovias.repository.port';
import { RUTAS_POR_CALLES, RutasPorCallesPort } from './application/rutas-por-calles.port';
import { SINIESTROS_REPOSITORY, SiniestrosRepositoryPort } from './application/siniestros.repository.port';
import { GoogleRutasPorCallesAdapter } from './infrastructure/google-rutas-por-calles.adapter';
import { PostgresRedCicloviasRepository } from './infrastructure/postgres-red-ciclovias.repository';
import { PostgresSiniestrosRepository } from './infrastructure/postgres-siniestros.repository';

// Calculo de rutas rapida y segura de la app movil sobre las ciclovias guardadas en PostgreSQL
@Module({
  providers: [
    { provide: RED_CICLOVIAS_REPOSITORY, useClass: PostgresRedCicloviasRepository },
    { provide: SINIESTROS_REPOSITORY, useClass: PostgresSiniestrosRepository },
    // Sin GOOGLE_MAPS_API_KEY el adaptador no hace nada y las rutas salen solo de la red de ciclovias
    { provide: RUTAS_POR_CALLES, useFactory: () => new GoogleRutasPorCallesAdapter(process.env.GOOGLE_MAPS_API_KEY ?? '') },
    // Se arma con una fabrica porque la capa de aplicacion no conoce NestJS
    // y es una sola instancia para que recuerde la red que ya armo
    {
      provide: CalcularRutasUseCase,
      useFactory: (ciclovias: RedCicloviasRepositoryPort, calles: RutasPorCallesPort, siniestros: SiniestrosRepositoryPort) =>
        new CalcularRutasUseCase(ciclovias, calles, siniestros),
      inject: [RED_CICLOVIAS_REPOSITORY, RUTAS_POR_CALLES, SINIESTROS_REPOSITORY],
    },
  ],
  exports: [CalcularRutasUseCase],
})
export class RoutesModule {}
