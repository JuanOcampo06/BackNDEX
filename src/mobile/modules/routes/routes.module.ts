import { Module } from '@nestjs/common';
import { CalcularRutasUseCase } from './application/calcular-rutas.use-case';
import { RED_CICLOVIAS_REPOSITORY, RedCicloviasRepositoryPort } from './application/red-ciclovias.repository.port';
import { PostgresRedCicloviasRepository } from './infrastructure/postgres-red-ciclovias.repository';

// Calculo de rutas rapida y segura de la app movil sobre las ciclovias guardadas en PostgreSQL
@Module({
  providers: [
    { provide: RED_CICLOVIAS_REPOSITORY, useClass: PostgresRedCicloviasRepository },
    // Se arma con una fabrica porque la capa de aplicacion no conoce NestJS
    // y es una sola instancia para que recuerde la red que ya armo
    {
      provide: CalcularRutasUseCase,
      useFactory: (ciclovias: RedCicloviasRepositoryPort) => new CalcularRutasUseCase(ciclovias),
      inject: [RED_CICLOVIAS_REPOSITORY],
    },
  ],
  exports: [CalcularRutasUseCase],
})
export class RoutesModule {}
