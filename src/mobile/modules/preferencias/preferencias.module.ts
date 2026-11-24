import { Module } from '@nestjs/common';
import { ActualizarPreferenciasUseCase } from './application/actualizar-preferencias.use-case';
import { ObtenerPreferenciasUseCase } from './application/obtener-preferencias.use-case';
import { PREFERENCIAS_REPOSITORY, PreferenciasRepositoryPort } from './application/preferencias.repository.port';
import { PostgresPreferenciasRepository } from './infrastructure/postgres-preferencias.repository';

// Preferencias de la app (tema, avatar, alertas, voz) guardadas en la cuenta del ciudadano en PostgreSQL
@Module({
  providers: [
    { provide: PREFERENCIAS_REPOSITORY, useClass: PostgresPreferenciasRepository },
    // Se arman con una fabrica porque la capa de aplicacion no conoce NestJS
    {
      provide: ObtenerPreferenciasUseCase,
      useFactory: (preferencias: PreferenciasRepositoryPort) => new ObtenerPreferenciasUseCase(preferencias),
      inject: [PREFERENCIAS_REPOSITORY],
    },
    {
      provide: ActualizarPreferenciasUseCase,
      useFactory: (preferencias: PreferenciasRepositoryPort) => new ActualizarPreferenciasUseCase(preferencias),
      inject: [PREFERENCIAS_REPOSITORY],
    },
  ],
  exports: [ObtenerPreferenciasUseCase, ActualizarPreferenciasUseCase],
})
export class PreferenciasModule {}
