import { CredencialesInvalidasError } from '../domain/credenciales-invalidas.error';
import { Usuario } from '../domain/usuario';
import { LoginUseCase } from './login.use-case';
import { TokenEmisorPort } from './token-emisor.port';
import { UsuarioRepositoryPort } from './usuario.repository.port';

class FakeUsuarioRepository implements UsuarioRepositoryPort {
  constructor(private readonly usuario: Usuario) {}

  async buscarPorCorreo(correo: string): Promise<Usuario | null> {
    return this.usuario.correo === correo ? this.usuario : null;
  }
}

describe('LoginUseCase', () => {
  const usuario = new Usuario({
    id: '7',
    nombreCompleto: 'Ana Prueba',
    correo: 'ana@prueba.local',
    rol: 'admin',
    contrasena: 'secreta',
  });
  // Emisor falso que deja ver con que id y rol se pidio el token
  const tokens: TokenEmisorPort = { emitir: (id, rol) => `token-${id}-${rol}` };
  const loginUseCase = new LoginUseCase(new FakeUsuarioRepository(usuario), tokens);

  it('devuelve el token y los datos del usuario con credenciales correctas', async () => {
    const resultado = await loginUseCase.execute({ correo: 'ana@prueba.local', contrasena: 'secreta' });

    expect(resultado).toEqual({
      token: 'token-7-admin',
      usuario: { id: '7', nombreCompleto: 'Ana Prueba', correo: 'ana@prueba.local', rol: 'admin' },
    });
  });

  it('lanza CredencialesInvalidasError con una contraseña incorrecta', async () => {
    await expect(
      loginUseCase.execute({ correo: 'ana@prueba.local', contrasena: 'otra' }),
    ).rejects.toBeInstanceOf(CredencialesInvalidasError);
  });
});
