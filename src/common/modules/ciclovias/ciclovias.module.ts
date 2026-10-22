import { Module } from '@nestjs/common';
import { CICLOVIA_REPOSITORY, CicloviaRepositoryPort } from './application/ciclovia.repository.port';
import { ObtenerCicloviasUseCase } from './application/obtener-ciclovias.use-case';
import { PostgresCicloviaRepository } from './infrastructure/postgres-ciclovia.repository';

// Ciclovias de OpenStreetMap que comparten el dashboard y la app movil
// NestJS crea este modulo una sola vez aunque lo importen los dos BFF
@Module({
  providers: [
    { provide: CICLOVIA_REPOSITORY, useClass: PostgresCicloviaRepository },
    // Se arma con una fabrica porque la capa de aplicacion no conoce NestJS
    {
      provide: ObtenerCicloviasUseCase,
      useFactory: (ciclovias: CicloviaRepositoryPort) => new ObtenerCicloviasUseCase(ciclovias),
      inject: [CICLOVIA_REPOSITORY],
    },
  ],
  exports: [ObtenerCicloviasUseCase],
})
export class CicloviasModule {}
