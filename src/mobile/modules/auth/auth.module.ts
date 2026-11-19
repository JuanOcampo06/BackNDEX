import { Module } from '@nestjs/common';
import { CIUDADANOS_REPOSITORY, CiudadanosRepositoryPort } from './application/ciudadanos.repository.port';
import { CodigosRepositoryPort, RESTABLECIMIENTOS_REPOSITORY, VERIFICACIONES_REPOSITORY } from './application/codigos.repository.port';
import { ConfirmarRestablecimientoUseCase } from './application/confirmar-restablecimiento.use-case';
import { CONTRASENA_CIFRADOR, ContrasenaCifradorPort } from './application/contrasena-cifrador.port';
import { IniciarSesionUseCase } from './application/iniciar-sesion.use-case';
import { NOTIFICADOR_CODIGOS, NotificadorCodigosPort } from './application/notificador-codigos.port';
import { RegistrarCiudadanoUseCase } from './application/registrar-ciudadano.use-case';
import { SolicitarRestablecimientoUseCase } from './application/solicitar-restablecimiento.use-case';
import { SolicitarVerificacionUseCase } from './application/solicitar-verificacion.use-case';
import { TOKEN_EMISOR, TokenEmisorPort } from './application/token-emisor.port';
import { VerificarCorreoUseCase } from './application/verificar-correo.use-case';
import { CorreoNotificadorCodigos } from './infrastructure/correo-notificador-codigos';
import { JwtTokenEmisor } from './infrastructure/jwt-token.emisor';
import { PostgresCiudadanosRepository } from './infrastructure/postgres-ciudadanos.repository';
import { PostgresCodigosRepository, TABLA_RESTABLECIMIENTOS, TABLA_VERIFICACIONES } from './infrastructure/postgres-codigos.repository';
import { RegistroNotificadorCodigos } from './infrastructure/registro-notificador-codigos';
import { ScryptContrasenaCifrador } from './infrastructure/scrypt-contrasena.cifrador';

// Registro, inicio de sesion, verificacion del correo y recuperacion de la contrasena de los ciudadanos de la app movil
// se arman con fabricas porque la capa de aplicacion no conoce NestJS
@Module({
  providers: [
    { provide: CIUDADANOS_REPOSITORY, useClass: PostgresCiudadanosRepository },
    { provide: CONTRASENA_CIFRADOR, useClass: ScryptContrasenaCifrador },
    { provide: TOKEN_EMISOR, useClass: JwtTokenEmisor },
    // Cada tipo de codigo se guarda en su propia tabla
    { provide: RESTABLECIMIENTOS_REPOSITORY, useFactory: () => new PostgresCodigosRepository(TABLA_RESTABLECIMIENTOS) },
    { provide: VERIFICACIONES_REPOSITORY, useFactory: () => new PostgresCodigosRepository(TABLA_VERIFICACIONES) },
    // Con SMTP_HOST los codigos llegan al correo del ciudadano y sin el solo quedan escritos en el registro de la api
    { provide: NOTIFICADOR_CODIGOS, useFactory: () => (process.env.SMTP_HOST ? new CorreoNotificadorCodigos() : new RegistroNotificadorCodigos()) },
    {
      provide: SolicitarVerificacionUseCase,
      useFactory: (ciudadanos: CiudadanosRepositoryPort, verificaciones: CodigosRepositoryPort, notificador: NotificadorCodigosPort) =>
        new SolicitarVerificacionUseCase(ciudadanos, verificaciones, notificador),
      inject: [CIUDADANOS_REPOSITORY, VERIFICACIONES_REPOSITORY, NOTIFICADOR_CODIGOS],
    },
    {
      provide: RegistrarCiudadanoUseCase,
      useFactory: (
        ciudadanos: CiudadanosRepositoryPort,
        cifrador: ContrasenaCifradorPort,
        tokens: TokenEmisorPort,
        verificacion: SolicitarVerificacionUseCase,
      ) => new RegistrarCiudadanoUseCase(ciudadanos, cifrador, tokens, verificacion),
      inject: [CIUDADANOS_REPOSITORY, CONTRASENA_CIFRADOR, TOKEN_EMISOR, SolicitarVerificacionUseCase],
    },
    {
      provide: IniciarSesionUseCase,
      useFactory: (ciudadanos: CiudadanosRepositoryPort, cifrador: ContrasenaCifradorPort, tokens: TokenEmisorPort) =>
        new IniciarSesionUseCase(ciudadanos, cifrador, tokens),
      inject: [CIUDADANOS_REPOSITORY, CONTRASENA_CIFRADOR, TOKEN_EMISOR],
    },
    {
      provide: VerificarCorreoUseCase,
      useFactory: (ciudadanos: CiudadanosRepositoryPort, verificaciones: CodigosRepositoryPort, tokens: TokenEmisorPort) =>
        new VerificarCorreoUseCase(ciudadanos, verificaciones, tokens),
      inject: [CIUDADANOS_REPOSITORY, VERIFICACIONES_REPOSITORY, TOKEN_EMISOR],
    },
    {
      provide: SolicitarRestablecimientoUseCase,
      useFactory: (ciudadanos: CiudadanosRepositoryPort, restablecimientos: CodigosRepositoryPort, notificador: NotificadorCodigosPort) =>
        new SolicitarRestablecimientoUseCase(ciudadanos, restablecimientos, notificador),
      inject: [CIUDADANOS_REPOSITORY, RESTABLECIMIENTOS_REPOSITORY, NOTIFICADOR_CODIGOS],
    },
    {
      provide: ConfirmarRestablecimientoUseCase,
      useFactory: (ciudadanos: CiudadanosRepositoryPort, restablecimientos: CodigosRepositoryPort, cifrador: ContrasenaCifradorPort) =>
        new ConfirmarRestablecimientoUseCase(ciudadanos, restablecimientos, cifrador),
      inject: [CIUDADANOS_REPOSITORY, RESTABLECIMIENTOS_REPOSITORY, CONTRASENA_CIFRADOR],
    },
  ],
  exports: [
    RegistrarCiudadanoUseCase,
    IniciarSesionUseCase,
    SolicitarVerificacionUseCase,
    VerificarCorreoUseCase,
    SolicitarRestablecimientoUseCase,
    ConfirmarRestablecimientoUseCase,
  ],
})
export class MobileAuthModule {}
