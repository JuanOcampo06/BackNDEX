import { Module } from '@nestjs/common';
import { LoginUseCase } from './application/login.use-case';
import { TOKEN_EMISOR, TokenEmisorPort } from './application/token-emisor.port';
import { USUARIO_REPOSITORY, UsuarioRepositoryPort } from './application/usuario.repository.port';
import { InMemoryUsuarioRepository } from './infrastructure/in-memory-usuario.repository';
import { JwtTokenEmisor } from './infrastructure/jwt-token.emisor';

@Module({
  providers: [
    { provide: USUARIO_REPOSITORY, useClass: InMemoryUsuarioRepository },
    { provide: TOKEN_EMISOR, useClass: JwtTokenEmisor },
    // La capa de aplicación no conoce NestJS, por eso se construye con una fábrica.
    {
      provide: LoginUseCase,
      useFactory: (usuarios: UsuarioRepositoryPort, tokens: TokenEmisorPort) => new LoginUseCase(usuarios, tokens),
      inject: [USUARIO_REPOSITORY, TOKEN_EMISOR],
    },
  ],
  exports: [LoginUseCase],
})
export class AuthModule {}
