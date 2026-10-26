import { Module } from '@nestjs/common';
import { CrearReporteUseCase } from './application/crear-reporte.use-case';
import { ListarReportesUseCase } from './application/listar-reportes.use-case';
import { ObtenerReporteUseCase } from './application/obtener-reporte.use-case';
import { REPORTES_REPOSITORY, ReportesRepositoryPort } from './application/reportes.repository.port';
import { PostgresReportesRepository } from './infrastructure/postgres-reportes.repository';

// Todos los casos de uso de reportes reciben el mismo puerto
const CASOS_DE_USO = [CrearReporteUseCase, ListarReportesUseCase, ObtenerReporteUseCase];

// Reportes ciudadanos de la app movil guardados en PostgreSQL
@Module({
  providers: [
    { provide: REPORTES_REPOSITORY, useClass: PostgresReportesRepository },
    // Se arman con una fabrica porque la capa de aplicacion no conoce NestJS
    ...CASOS_DE_USO.map((CasoDeUso) => ({
      provide: CasoDeUso,
      useFactory: (reportes: ReportesRepositoryPort) => new CasoDeUso(reportes),
      inject: [REPORTES_REPOSITORY],
    })),
  ],
  exports: CASOS_DE_USO,
})
export class ReportsModule {}
