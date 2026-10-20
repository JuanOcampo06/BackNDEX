import { Module } from '@nestjs/common';
import { ObtenerBotonPanicoUseCase } from './application/obtener-boton-panico.use-case';
import { ObtenerFalsosPositivosUseCase } from './application/obtener-falsos-positivos.use-case';
import { ObtenerFiltrosUseCase } from './application/obtener-filtros.use-case';
import { ObtenerLugaresConMasSiniestrosUseCase } from './application/obtener-lugares-con-mas-siniestros.use-case';
import { ObtenerMapaSiniestrosUseCase } from './application/obtener-mapa-siniestros.use-case';
import { ObtenerReportesUseCase } from './application/obtener-reportes.use-case';
import { ObtenerSiniestrosPorHoraUseCase } from './application/obtener-siniestros-por-hora.use-case';
import { ObtenerSiniestrosPorSexoYEdadUseCase } from './application/obtener-siniestros-por-sexo-y-edad.use-case';
import { ObtenerTarjetaUseCase } from './application/obtener-tarjeta.use-case';
import { ObtenerTendenciaMensualUseCase } from './application/obtener-tendencia-mensual.use-case';
import { ObtenerUsuariosPorTipoUseCase } from './application/obtener-usuarios-por-tipo.use-case';
import { TABLERO_REPOSITORY, TableroRepositoryPort } from './application/tablero.repository.port';
import { PostgresTableroRepository } from './infrastructure/postgres-tablero.repository';

// Todos los casos de uso del tablero reciben el mismo puerto
const CASOS_DE_USO = [
  ObtenerFiltrosUseCase,
  ObtenerTarjetaUseCase,
  ObtenerMapaSiniestrosUseCase,
  ObtenerLugaresConMasSiniestrosUseCase,
  ObtenerSiniestrosPorHoraUseCase,
  ObtenerTendenciaMensualUseCase,
  ObtenerSiniestrosPorSexoYEdadUseCase,
  ObtenerUsuariosPorTipoUseCase,
  ObtenerBotonPanicoUseCase,
  ObtenerReportesUseCase,
  ObtenerFalsosPositivosUseCase,
];

// Cifras graficas y mapas del tablero leidos desde PostgreSQL
@Module({
  providers: [
    { provide: TABLERO_REPOSITORY, useClass: PostgresTableroRepository },
    // Se arman con una fabrica porque la capa de aplicacion no conoce NestJS
    ...CASOS_DE_USO.map((CasoDeUso) => ({
      provide: CasoDeUso,
      useFactory: (tablero: TableroRepositoryPort) => new CasoDeUso(tablero),
      inject: [TABLERO_REPOSITORY],
    })),
  ],
  exports: CASOS_DE_USO,
})
export class KpisModule {}
