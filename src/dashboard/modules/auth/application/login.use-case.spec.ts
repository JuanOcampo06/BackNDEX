import { CredencialesInvalidasError } from '../domain/credenciales-invalidas.error';
import { Usuario } from '../domain/usuario';
import { LoginUseCase } from './login.use-case';
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
  const loginUseCase = new LoginUseCase(new FakeUsuarioRepository(usuario));

  it('devuelve el token y los datos del usuario con credenciales correctas', async () => {
    const resultado = await loginUseCase.execute({ correo: 'ana@prueba.local', contrasena: 'secreta' });

    expect(resultado).toEqual({
      token: 'token-de-prueba',
      usuario: { id: '7', nombreCompleto: 'Ana Prueba', correo: 'ana@prueba.local', rol: 'admin' },
    });
  });

  it('lanza CredencialesInvalidasError con una contraseña incorrecta', async () => {
    await expect(
      loginUseCase.execute({ correo: 'ana@prueba.local', contrasena: 'otra' }),
    ).rejects.toBeInstanceOf(CredencialesInvalidasError);
  });
});
