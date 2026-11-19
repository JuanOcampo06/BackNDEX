import { Logger, Module, OnApplicationBootstrap, OnModuleInit } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { CONSULTA_ACCESO_DASHBOARD, ConsultaAccesoDashboard, validarSecretoJwt } from '../../platform/auth';
import { AuthModule, ObtenerEstadoDeAccesoUseCase } from '../modules/auth';
import { CrearAdministradorInicialUseCase, DomainError, UsersModule } from '../modules/users';
import { KpisModule } from '../modules/kpis';
// Modulo comun de ciclovias que tambien usa la app movil
import { CicloviasModule } from '../../common/modules/ciclovias';
import { AuthController } from './controllers/auth.controller';
// Controlador nuevo con los endpoints de las tarjetas y graficas del tablero
import { TableroController } from './controllers/tablero.controller';
// Controlador del boton Exportar que descarga los KPIs elegidos en un Excel
import { ExportarKpisController } from './controllers/exportar-kpis.controller';
import { CicloviasController } from './controllers/ciclovias.controller';
// Controlador para crear editar y eliminar usuarios del dashboard
import { UsuariosController } from './controllers/usuarios.controller';

// Única puerta HTTP del dashboard: todo cuelga de /api/dashboard/v1.
@Module({
  imports: [
    AuthModule,
    UsersModule,
    KpisModule,
    CicloviasModule,
    RouterModule.register([{ path: 'dashboard/v1', module: DashboardBffModule }]),
  ],
  controllers: [AuthController, TableroController, ExportarKpisController, CicloviasController, UsuariosController],
  providers: [
    // El DashboardAuthGuard de platform/auth consulta el estado actual del usuario con el modulo auth del dashboard
    {
      provide: CONSULTA_ACCESO_DASHBOARD,
      useFactory: (obtenerEstado: ObtenerEstadoDeAccesoUseCase): ConsultaAccesoDashboard => ({
        estadoActual: (usuarioId) => obtenerEstado.execute(usuarioId),
      }),
      inject: [ObtenerEstadoDeAccesoUseCase],
    },
  ],
})
export class DashboardBffModule implements OnModuleInit, OnApplicationBootstrap {
  private readonly registro = new Logger('AdministradorInicial');

  constructor(private readonly crearAdministradorInicial: CrearAdministradorInicialUseCase) {}

  // Sin un JWT_SECRET seguro la api no arranca porque cualquiera podria firmar tokens del dashboard
  onModuleInit(): void {
    validarSecretoJwt();
  }

  // Crea el primer administrador con ADMIN_CORREO y ADMIN_CONTRASENA si la base no tiene ninguno
  // con datos invalidos la api no arranca y si la base no responde lo deja en el registro y sigue
  // asi la app movil funciona aunque la base del dashboard no este lista
  async onApplicationBootstrap(): Promise<void> {
    try {
      const resultado = await this.crearAdministradorInicial.execute({
        correo: variable('ADMIN_CORREO'),
        contrasena: variable('ADMIN_CONTRASENA'),
      });
      this.informar(resultado);
    } catch (error) {
      if (error instanceof DomainError) {
        throw new Error(`ADMIN_CORREO o ADMIN_CONTRASENA no son validos: ${error.message}`, { cause: error });
      }
      this.registro.error(`No se pudo revisar el administrador inicial: ${(error as Error).message}`);
    }
  }

  private informar(resultado: string): void {
    if (resultado === 'creado') {
      this.registro.log('Se creo el administrador inicial y debe cambiar su contrasena en el primer ingreso');
    } else if (resultado === 'sin-datos') {
      this.registro.warn('ADMIN_CORREO y ADMIN_CONTRASENA no estan definidas: si la base no tiene un administrador nadie podra entrar al dashboard');
    }
  }
}

// Una variable vacia cuenta como no definida
function variable(nombre: string): string | undefined {
  const valor = process.env[nombre]?.trim();
  return valor === undefined || valor === '' ? undefined : valor;
}
