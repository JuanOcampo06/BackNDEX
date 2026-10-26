import { CambiosUsuario, NuevoUsuario, Usuario } from '../domain/usuario';
import { ActualizarUsuarioUseCase } from './actualizar-usuario.use-case';
import { CrearUsuarioUseCase } from './crear-usuario.use-case';
import { EliminarUsuarioUseCase } from './eliminar-usuario.use-case';
import { UsuariosRepositoryPort } from './usuarios.repository.port';

const FECHA = '2026-10-27T15:00:00.000Z';

// Repositorio falso en memoria que ya trae al admin con id 1
function crearRepositorio(): UsuariosRepositoryPort {
  const guardados: Usuario[] = [
    { id: 1, nombreCompleto: 'Admin Demo', correo: 'admin@demo.local', rol: 'admin', creadoEn: FECHA, actualizadoEn: FECHA },
  ];
  return {
    listar: async () => guardados,
    buscarPorId: async (id) => guardados.find((u) => u.id === id) ?? null,
    existeCorreo: async (correo, idExcluido) => guardados.some((u) => u.correo === correo && u.id !== idExcluido),
    crear: async (nuevo: NuevoUsuario) => {
      const usuario: Usuario = { id: guardados.length + 1, ...nuevo, creadoEn: FECHA, actualizadoEn: FECHA };
      guardados.push(usuario);
      return usuario;
    },
    actualizar: async (id, cambios: CambiosUsuario) => {
      const usuario = guardados.find((u) => u.id === id) as Usuario;
      Object.assign(usuario, cambios);
      return usuario;
    },
    eliminar: async (id) => {
      const posicion = guardados.findIndex((u) => u.id === id);
      if (posicion === -1) return false;
      guardados.splice(posicion, 1);
      return true;
    },
  };
}

describe('CrearUsuarioUseCase', () => {
  it('crea el usuario con el correo en minusculas y el nombre sin espacios de sobra', async () => {
    const usuario = await new CrearUsuarioUseCase(crearRepositorio()).execute({
      nombreCompleto: '  Ana Lopez ',
      correo: 'Ana.Lopez@Demo.Local',
      rol: 'lector',
    });

    expect(usuario).toMatchObject({ id: 2, nombreCompleto: 'Ana Lopez', correo: 'ana.lopez@demo.local', rol: 'lector' });
  });

  it('rechaza un rol que no existe', async () => {
    await expect(
      new CrearUsuarioUseCase(crearRepositorio()).execute({ nombreCompleto: 'Ana', correo: 'ana@demo.local', rol: 'jefe' }),
    ).rejects.toMatchObject({ codigo: 'USUARIO_INVALIDO' });
  });

  it('rechaza un correo que ya usa otro usuario aunque cambien las mayusculas', async () => {
    await expect(
      new CrearUsuarioUseCase(crearRepositorio()).execute({ nombreCompleto: 'Otro', correo: 'ADMIN@demo.local', rol: 'lector' }),
    ).rejects.toMatchObject({ codigo: 'CORREO_DUPLICADO' });
  });
});

describe('ActualizarUsuarioUseCase', () => {
  it('cambia solo el rol', async () => {
    const usuario = await new ActualizarUsuarioUseCase(crearRepositorio()).execute(1, { rol: 'lector' });

    expect(usuario).toMatchObject({ id: 1, nombreCompleto: 'Admin Demo', rol: 'lector' });
  });

  it('deja guardar su mismo correo', async () => {
    const usuario = await new ActualizarUsuarioUseCase(crearRepositorio()).execute(1, { correo: 'admin@demo.local' });

    expect(usuario.correo).toBe('admin@demo.local');
  });

  it('rechaza una actualizacion sin campos', async () => {
    await expect(new ActualizarUsuarioUseCase(crearRepositorio()).execute(1, {})).rejects.toMatchObject({
      codigo: 'USUARIO_INVALIDO',
    });
  });

  it('avisa cuando el usuario no existe', async () => {
    await expect(new ActualizarUsuarioUseCase(crearRepositorio()).execute(9, { rol: 'admin' })).rejects.toMatchObject({
      codigo: 'USUARIO_NO_ENCONTRADO',
    });
  });
});

describe('EliminarUsuarioUseCase', () => {
  it('elimina un usuario y la segunda vez avisa que ya no existe', async () => {
    const repositorio = crearRepositorio();
    await new EliminarUsuarioUseCase(repositorio).execute(1);

    await expect(new EliminarUsuarioUseCase(repositorio).execute(1)).rejects.toMatchObject({ codigo: 'USUARIO_NO_ENCONTRADO' });
  });
});
