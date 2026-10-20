import { Module } from '@nestjs/common';
import { LoginUseCase } from './application/login.use-case';
import { USUARIO_REPOSITORY, UsuarioRepositoryPort } from './application/usuario.repository.port';
import { InMemoryUsuarioRepository } from './infrastructure/in-memory-usuario.repository';

@Module({
  providers: [
    { provide: USUARIO_REPOSITORY, useClass: InMemoryUsuarioRepository },
    // La capa de aplicación no conoce NestJS, por eso se construye con una fábrica.
    {
      provide: LoginUseCase,
      useFactory: (usuarios: UsuarioRepositoryPort) => new LoginUseCase(usuarios),
      inject: [USUARIO_REPOSITORY],
    },
  ],
  exports: [LoginUseCase],
})
export class AuthModule {}
