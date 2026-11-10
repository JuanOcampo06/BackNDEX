import { Module } from '@nestjs/common';
import { FinalizarViajeUseCase } from './application/finalizar-viaje.use-case';
import { IniciarViajeUseCase } from './application/iniciar-viaje.use-case';
import { ListarViajesUseCase } from './application/listar-viajes.use-case';
import { ObtenerViajeUseCase } from './application/obtener-viaje.use-case';
import { RegistrarPuntoUseCase } from './application/registrar-punto.use-case';
import { VIAJES_REPOSITORY, ViajesRepositoryPort } from './application/viajes.repository.port';
import { PostgresViajesRepository } from './infrastructure/postgres-viajes.repository';

// Todos los casos de uso de viajes reciben el mismo puerto
const CASOS_DE_USO = [IniciarViajeUseCase, RegistrarPuntoUseCase, FinalizarViajeUseCase, ListarViajesUseCase, ObtenerViajeUseCase];

// Viajes en bicicleta de la app movil guardados en PostgreSQL
@Module({
  providers: [
    { provide: VIAJES_REPOSITORY, useClass: PostgresViajesRepository },
    // Se arman con una fabrica porque la capa de aplicacion no conoce NestJS
    ...CASOS_DE_USO.map((CasoDeUso) => ({
      provide: CasoDeUso,
      useFactory: (viajes: ViajesRepositoryPort) => new CasoDeUso(viajes),
      inject: [VIAJES_REPOSITORY],
    })),
  ],
  exports: CASOS_DE_USO,
})
export class TripsModule {}
