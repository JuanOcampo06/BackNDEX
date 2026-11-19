import { Module } from '@nestjs/common';
import { ObtenerSemaforosUseCase } from './application/obtener-semaforos.use-case';
import { SEMAFOROS_REPOSITORY, SemaforosRepositoryPort } from './application/semaforos.repository.port';
import { PostgresSemaforosRepository } from './infrastructure/postgres-semaforos.repository';

// Semaforos de las ciclorrutas que la app movil dibuja en el mapa, guardados en PostgreSQL
@Module({
  providers: [
    { provide: SEMAFOROS_REPOSITORY, useClass: PostgresSemaforosRepository },
    // Se arma con una fabrica porque la capa de aplicacion no conoce NestJS
    {
      provide: ObtenerSemaforosUseCase,
      useFactory: (semaforos: SemaforosRepositoryPort) => new ObtenerSemaforosUseCase(semaforos),
      inject: [SEMAFOROS_REPOSITORY],
    },
  ],
  exports: [ObtenerSemaforosUseCase],
})
export class SemaforosModule {}
