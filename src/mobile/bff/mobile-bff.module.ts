import { Module, OnModuleInit } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { validarSecretoJwt } from '../../platform/auth';
import { MobileAuthModule } from '../modules/auth';
import { ContactosModule } from '../modules/contactos';
import { MapaCalorModule } from '../modules/mapa-calor';
import { PreferenciasModule } from '../modules/preferencias';
import { ReportsModule } from '../modules/reports';
import { RoutesModule } from '../modules/routes';
import { SemaforosModule } from '../modules/semaforos';
import { SosModule } from '../modules/sos';
import { TripsModule } from '../modules/trips';
// Modulo comun de ciclovias que tambien usa el dashboard
import { CicloviasModule } from '../../common/modules/ciclovias';
// Primer controlador de la app movil con las ciclovias de la zona del mapa
import { CicloviasController } from './controllers/ciclovias.controller';
// Controladores de la app: registro y login, contactos de emergencia, mapa de calor, preferencias, reportes ciudadanos, rutas, semaforos, boton de panico y viajes
import { AuthController } from './controllers/auth.controller';
import { ContactosController } from './controllers/contactos.controller';
import { InvitacionesController } from './controllers/invitaciones.controller';
import { MapaCalorController } from './controllers/mapa-calor.controller';
import { PreferenciasController } from './controllers/preferencias.controller';
import { ReportsController } from './controllers/reports.controller';
import { RoutesController } from './controllers/routes.controller';
import { SemaforosController } from './controllers/semaforos.controller';
import { SosController } from './controllers/sos.controller';
import { TripsController } from './controllers/trips.controller';

// Única puerta HTTP de la app móvil: todo cuelga de /api/mobile/v1.
@Module({
  imports: [
    MobileAuthModule,
    ContactosModule,
    MapaCalorModule,
    PreferenciasModule,
    ReportsModule,
    RoutesModule,
    SemaforosModule,
    SosModule,
    TripsModule,
    CicloviasModule,
    RouterModule.register([{ path: 'mobile/v1', module: MobileBffModule }]),
  ],
  controllers: [AuthController, CicloviasController, ContactosController, InvitacionesController, MapaCalorController, PreferenciasController, ReportsController, RoutesController, SemaforosController, SosController, TripsController],
})
export class MobileBffModule implements OnModuleInit {
  // Sin un JWT_SECRET seguro la api no arranca porque cualquiera podria firmar tokens de ciudadanos
  onModuleInit(): void {
    validarSecretoJwt();
  }
}
