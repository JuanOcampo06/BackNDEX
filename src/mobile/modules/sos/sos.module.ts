import { Module } from '@nestjs/common';
import { ActivarSosUseCase } from './application/activar-sos.use-case';
import { CancelarSosUseCase } from './application/cancelar-sos.use-case';
import { ListarSosUseCase } from './application/listar-sos.use-case';
import { SOS_REPOSITORY, SosRepositoryPort } from './application/sos.repository.port';
import { PostgresSosRepository } from './infrastructure/postgres-sos.repository';

// Todos los casos de uso del boton de panico reciben el mismo puerto
const CASOS_DE_USO = [ActivarSosUseCase, ListarSosUseCase, CancelarSosUseCase];

// Boton de panico de la app movil guardado en PostgreSQL
@Module({
  providers: [
    { provide: SOS_REPOSITORY, useClass: PostgresSosRepository },
    // Se arman con una fabrica porque la capa de aplicacion no conoce NestJS
    ...CASOS_DE_USO.map((CasoDeUso) => ({
      provide: CasoDeUso,
      useFactory: (sos: SosRepositoryPort) => new CasoDeUso(sos),
      inject: [SOS_REPOSITORY],
    })),
  ],
  exports: CASOS_DE_USO,
})
export class SosModule {}
