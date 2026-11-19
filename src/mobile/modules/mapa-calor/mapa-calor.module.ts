import { Module } from '@nestjs/common';
import { FUENTES_DE_CALOR, FuentesDeCalorPort } from './application/fuentes-de-calor.port';
import { ObtenerMapaCalorUseCase } from './application/obtener-mapa-calor.use-case';
import { PostgresFuentesDeCalor } from './infrastructure/postgres-fuentes-de-calor';

// Mapa de calor de la app movil con los siniestros del anuario y los reportes de los ciudadanos
@Module({
  providers: [
    { provide: FUENTES_DE_CALOR, useClass: PostgresFuentesDeCalor },
    // Se arma con una fabrica porque la capa de aplicacion no conoce NestJS
    {
      provide: ObtenerMapaCalorUseCase,
      useFactory: (fuentes: FuentesDeCalorPort) => new ObtenerMapaCalorUseCase(fuentes),
      inject: [FUENTES_DE_CALOR],
    },
  ],
  exports: [ObtenerMapaCalorUseCase],
})
export class MapaCalorModule {}
