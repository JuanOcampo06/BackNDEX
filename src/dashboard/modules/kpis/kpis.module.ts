import { Module } from '@nestjs/common';
import { ExportarKpisUseCase } from './application/exportar-kpis.use-case';
import { GENERADOR_EXCEL, GeneradorExcelPort } from './application/generador-excel.port';
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
import { ObtenerUltimoMesConDatosUseCase } from './application/obtener-ultimo-mes-con-datos.use-case';
import { ObtenerUsuariosPorTipoUseCase } from './application/obtener-usuarios-por-tipo.use-case';
import { TABLERO_REPOSITORY, TableroRepositoryPort } from './application/tablero.repository.port';
import { ExcelJsGeneradorExcel } from './infrastructure/exceljs-generador-excel';
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
    ...[...CASOS_DE_USO, ObtenerUltimoMesConDatosUseCase].map((CasoDeUso) => ({
      provide: CasoDeUso,
      useFactory: (tablero: TableroRepositoryPort) => new CasoDeUso(tablero),
      inject: [TABLERO_REPOSITORY],
    })),
    { provide: GENERADOR_EXCEL, useClass: ExcelJsGeneradorExcel },
    // La exportacion a Excel reutiliza los casos de uso del tablero y por eso se arma aparte
    {
      provide: ExportarKpisUseCase,
      useFactory: (
        filtros: ObtenerFiltrosUseCase,
        tarjeta: ObtenerTarjetaUseCase,
        mapaSiniestros: ObtenerMapaSiniestrosUseCase,
        lugaresConMasSiniestros: ObtenerLugaresConMasSiniestrosUseCase,
        siniestrosPorHora: ObtenerSiniestrosPorHoraUseCase,
        tendenciaMensual: ObtenerTendenciaMensualUseCase,
        siniestrosPorSexoYEdad: ObtenerSiniestrosPorSexoYEdadUseCase,
        usuariosPorTipo: ObtenerUsuariosPorTipoUseCase,
        botonPanico: ObtenerBotonPanicoUseCase,
        reportes: ObtenerReportesUseCase,
        falsosPositivos: ObtenerFalsosPositivosUseCase,
        generador: GeneradorExcelPort,
      ) =>
        new ExportarKpisUseCase(
          {
            filtros,
            tarjeta,
            mapaSiniestros,
            lugaresConMasSiniestros,
            siniestrosPorHora,
            tendenciaMensual,
            siniestrosPorSexoYEdad,
            usuariosPorTipo,
            botonPanico,
            reportes,
            falsosPositivos,
          },
          generador,
        ),
      inject: [...CASOS_DE_USO, GENERADOR_EXCEL],
    },
  ],
  exports: [...CASOS_DE_USO, ObtenerUltimoMesConDatosUseCase, ExportarKpisUseCase],
})
export class KpisModule {}
