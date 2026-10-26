import { Module } from '@nestjs/common';
import { ActualizarUsuarioUseCase } from './application/actualizar-usuario.use-case';
import { CrearUsuarioUseCase } from './application/crear-usuario.use-case';
import { EliminarUsuarioUseCase } from './application/eliminar-usuario.use-case';
import { ListarUsuariosUseCase } from './application/listar-usuarios.use-case';
import { ObtenerUsuarioUseCase } from './application/obtener-usuario.use-case';
import { USUARIOS_REPOSITORY, UsuariosRepositoryPort } from './application/usuarios.repository.port';
import { PostgresUsuariosRepository } from './infrastructure/postgres-usuarios.repository';

// Todos los casos de uso de usuarios reciben el mismo puerto
const CASOS_DE_USO = [
  ListarUsuariosUseCase,
  ObtenerUsuarioUseCase,
  CrearUsuarioUseCase,
  ActualizarUsuarioUseCase,
  EliminarUsuarioUseCase,
];

// Gestion de usuarios del dashboard guardados en PostgreSQL
@Module({
  providers: [
    { provide: USUARIOS_REPOSITORY, useClass: PostgresUsuariosRepository },
    // Se arman con una fabrica porque la capa de aplicacion no conoce NestJS
    ...CASOS_DE_USO.map((CasoDeUso) => ({
      provide: CasoDeUso,
      useFactory: (usuarios: UsuariosRepositoryPort) => new CasoDeUso(usuarios),
      inject: [USUARIOS_REPOSITORY],
    })),
  ],
  exports: CASOS_DE_USO,
})
export class UsersModule {}
