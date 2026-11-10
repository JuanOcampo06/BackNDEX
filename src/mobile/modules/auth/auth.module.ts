import { Module } from '@nestjs/common';
import { CIUDADANOS_REPOSITORY, CiudadanosRepositoryPort } from './application/ciudadanos.repository.port';
import { CONTRASENA_CIFRADOR, ContrasenaCifradorPort } from './application/contrasena-cifrador.port';
import { IniciarSesionUseCase } from './application/iniciar-sesion.use-case';
import { RegistrarCiudadanoUseCase } from './application/registrar-ciudadano.use-case';
import { TOKEN_EMISOR, TokenEmisorPort } from './application/token-emisor.port';
import { JwtTokenEmisor } from './infrastructure/jwt-token.emisor';
import { PostgresCiudadanosRepository } from './infrastructure/postgres-ciudadanos.repository';
import { ScryptContrasenaCifrador } from './infrastructure/scrypt-contrasena.cifrador';

// Los dos casos de uso reciben los mismos tres puertos
const CASOS_DE_USO = [RegistrarCiudadanoUseCase, IniciarSesionUseCase];

// Registro e inicio de sesion de los ciudadanos de la app movil
@Module({
  providers: [
    { provide: CIUDADANOS_REPOSITORY, useClass: PostgresCiudadanosRepository },
    { provide: CONTRASENA_CIFRADOR, useClass: ScryptContrasenaCifrador },
    { provide: TOKEN_EMISOR, useClass: JwtTokenEmisor },
    // Se arman con una fabrica porque la capa de aplicacion no conoce NestJS
    ...CASOS_DE_USO.map((CasoDeUso) => ({
      provide: CasoDeUso,
      useFactory: (ciudadanos: CiudadanosRepositoryPort, cifrador: ContrasenaCifradorPort, tokens: TokenEmisorPort) =>
        new CasoDeUso(ciudadanos, cifrador, tokens),
      inject: [CIUDADANOS_REPOSITORY, CONTRASENA_CIFRADOR, TOKEN_EMISOR],
    })),
  ],
  exports: CASOS_DE_USO,
})
export class MobileAuthModule {}
