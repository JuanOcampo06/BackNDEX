import { Module } from '@nestjs/common';
import { ConfirmarRestablecimientoUseCase } from './application/confirmar-restablecimiento.use-case';
import { CONTRASENA_CIFRADOR, ContrasenaCifradorPort } from './application/contrasena-cifrador.port';
import { LoginUseCase } from './application/login.use-case';
import { NOTIFICADOR_RESTABLECIMIENTO, NotificadorRestablecimientoPort } from './application/notificador-restablecimiento.port';
import { RESTABLECIMIENTOS_REPOSITORY, RestablecimientosRepositoryPort } from './application/restablecimientos.repository.port';
import { SolicitarRestablecimientoUseCase } from './application/solicitar-restablecimiento.use-case';
import { TOKEN_EMISOR, TokenEmisorPort } from './application/token-emisor.port';
import { USUARIO_REPOSITORY, UsuarioRepositoryPort } from './application/usuario.repository.port';
import { JwtTokenEmisor } from './infrastructure/jwt-token.emisor';
import { PostgresRestablecimientosRepository } from './infrastructure/postgres-restablecimientos.repository';
import { PostgresUsuarioRepository } from './infrastructure/postgres-usuario.repository';
import { RegistroNotificadorRestablecimiento } from './infrastructure/registro-notificador-restablecimiento';
import { ScryptContrasenaCifrador } from './infrastructure/scrypt-contrasena.cifrador';

@Module({
  providers: [
    { provide: USUARIO_REPOSITORY, useClass: PostgresUsuarioRepository },
    { provide: RESTABLECIMIENTOS_REPOSITORY, useClass: PostgresRestablecimientosRepository },
    { provide: CONTRASENA_CIFRADOR, useClass: ScryptContrasenaCifrador },
    { provide: TOKEN_EMISOR, useClass: JwtTokenEmisor },
    { provide: NOTIFICADOR_RESTABLECIMIENTO, useClass: RegistroNotificadorRestablecimiento },
    // La capa de aplicación no conoce NestJS, por eso se construye con una fábrica.
    {
      provide: LoginUseCase,
      useFactory: (usuarios: UsuarioRepositoryPort, cifrador: ContrasenaCifradorPort, tokens: TokenEmisorPort) =>
        new LoginUseCase(usuarios, cifrador, tokens),
      inject: [USUARIO_REPOSITORY, CONTRASENA_CIFRADOR, TOKEN_EMISOR],
    },
    {
      provide: SolicitarRestablecimientoUseCase,
      useFactory: (
        usuarios: UsuarioRepositoryPort,
        restablecimientos: RestablecimientosRepositoryPort,
        notificador: NotificadorRestablecimientoPort,
      ) => new SolicitarRestablecimientoUseCase(usuarios, restablecimientos, notificador),
      inject: [USUARIO_REPOSITORY, RESTABLECIMIENTOS_REPOSITORY, NOTIFICADOR_RESTABLECIMIENTO],
    },
    {
      provide: ConfirmarRestablecimientoUseCase,
      useFactory: (
        usuarios: UsuarioRepositoryPort,
        restablecimientos: RestablecimientosRepositoryPort,
        cifrador: ContrasenaCifradorPort,
      ) => new ConfirmarRestablecimientoUseCase(usuarios, restablecimientos, cifrador),
      inject: [USUARIO_REPOSITORY, RESTABLECIMIENTOS_REPOSITORY, CONTRASENA_CIFRADOR],
    },
  ],
  exports: [LoginUseCase, SolicitarRestablecimientoUseCase, ConfirmarRestablecimientoUseCase],
})
export class AuthModule {}
