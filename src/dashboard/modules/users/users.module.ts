import { Module } from '@nestjs/common';
import { ActualizarUsuarioUseCase } from './application/actualizar-usuario.use-case';
import { CrearUsuarioUseCase } from './application/crear-usuario.use-case';
import { EliminarUsuarioUseCase } from './application/eliminar-usuario.use-case';
import { ListarUsuariosUseCase } from './application/listar-usuarios.use-case';
import { ObtenerUsuarioUseCase } from './application/obtener-usuario.use-case';
import { CONTRASENA_CIFRADOR, ContrasenaCifradorPort } from './application/contrasena-cifrador.port';
import { USUARIOS_REPOSITORY, UsuariosRepositoryPort } from './application/usuarios.repository.port';
import { PostgresUsuariosRepository } from './infrastructure/postgres-usuarios.repository';
import { ScryptContrasenaCifrador } from './infrastructure/scrypt-contrasena.cifrador';

// Estos casos de uso solo reciben el puerto de la base
const CASOS_DE_LECTURA = [ListarUsuariosUseCase, ObtenerUsuarioUseCase, EliminarUsuarioUseCase];

// Crear y actualizar tambien cifran la contrasena
const CASOS_CON_CONTRASENA = [CrearUsuarioUseCase, ActualizarUsuarioUseCase];

// Gestion de usuarios del dashboard guardados en PostgreSQL
@Module({
  providers: [
    { provide: USUARIOS_REPOSITORY, useClass: PostgresUsuariosRepository },
    { provide: CONTRASENA_CIFRADOR, useClass: ScryptContrasenaCifrador },
    // Se arman con una fabrica porque la capa de aplicacion no conoce NestJS
    ...CASOS_DE_LECTURA.map((CasoDeUso) => ({
      provide: CasoDeUso,
      useFactory: (usuarios: UsuariosRepositoryPort) => new CasoDeUso(usuarios),
      inject: [USUARIOS_REPOSITORY],
    })),
    ...CASOS_CON_CONTRASENA.map((CasoDeUso) => ({
      provide: CasoDeUso,
      useFactory: (usuarios: UsuariosRepositoryPort, cifrador: ContrasenaCifradorPort) => new CasoDeUso(usuarios, cifrador),
      inject: [USUARIOS_REPOSITORY, CONTRASENA_CIFRADOR],
    })),
  ],
  exports: [...CASOS_DE_LECTURA, ...CASOS_CON_CONTRASENA],
})
export class UsersModule {}
