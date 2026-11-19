import { CambiosParaGuardar, Usuario, UsuarioParaGuardar } from '../domain/usuario';
import { ActualizarUsuarioUseCase } from './actualizar-usuario.use-case';
import { ContrasenaCifradorPort } from './contrasena-cifrador.port';
import { CrearAdministradorInicialUseCase } from './crear-administrador-inicial.use-case';
import { CrearUsuarioUseCase } from './crear-usuario.use-case';
import { EliminarUsuarioUseCase } from './eliminar-usuario.use-case';
import { UsuariosRepositoryPort } from './usuarios.repository.port';

const FECHA = '2026-10-27T15:00:00.000Z';

// Cifrador falso que deja ver que la contrasena no se guarda en texto plano
const cifrador: ContrasenaCifradorPort = { cifrar: async (contrasena) => `cifrada:${contrasena}` };

// Contrasenas cifradas que recibio el repositorio falso por id de usuario
let contrasenasGuardadas: Map<number, string>;

// Repositorio falso en memoria que ya trae al admin con id 1
function crearRepositorio(): UsuariosRepositoryPort {
  contrasenasGuardadas = new Map();
  const guardados: Usuario[] = [
    { id: 1, nombreCompleto: 'Admin Demo', correo: 'admin@demo.local', rol: 'admin', entidad: null, ultimoIngreso: null, debeCambiarContrasena: false, creadoEn: FECHA, actualizadoEn: FECHA },
  ];
  return {
    listar: async ({ rol }) => guardados.filter((u) => rol === undefined || u.rol === rol),
    buscarPorId: async (id) => guardados.find((u) => u.id === id) ?? null,
    existeCorreo: async (correo, idExcluido) => guardados.some((u) => u.correo === correo && u.id !== idExcluido),
    crear: async ({ contrasenaCifrada, ...nuevo }: UsuarioParaGuardar) => {
      const usuario: Usuario = { id: guardados.length + 1, ...nuevo, ultimoIngreso: null, creadoEn: FECHA, actualizadoEn: FECHA };
      guardados.push(usuario);
      contrasenasGuardadas.set(usuario.id, contrasenaCifrada);
      return usuario;
    },
    actualizar: async (id, { contrasenaCifrada, ...cambios }: CambiosParaGuardar) => {
      const usuario = guardados.find((u) => u.id === id) as Usuario;
      Object.assign(usuario, cambios);
      if (contrasenaCifrada !== undefined) contrasenasGuardadas.set(id, contrasenaCifrada);
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
    const usuario = await new CrearUsuarioUseCase(crearRepositorio(), cifrador).execute({
      nombreCompleto: '  Ana Lopez ',
      correo: 'Ana.Lopez@Demo.Local',
      rol: 'lector',
      contrasena: 'Clave-segura1',
    });

    expect(usuario).toMatchObject({ id: 2, nombreCompleto: 'Ana Lopez', correo: 'ana.lopez@demo.local', rol: 'lector' });
  });

  it('rechaza un rol que no existe', async () => {
    await expect(
      new CrearUsuarioUseCase(crearRepositorio(), cifrador).execute({ nombreCompleto: 'Ana', correo: 'ana@demo.local', rol: 'jefe', contrasena: 'Clave-segura1' }),
    ).rejects.toMatchObject({ codigo: 'USUARIO_INVALIDO' });
  });

  it('rechaza un correo que ya usa otro usuario aunque cambien las mayusculas', async () => {
    await expect(
      new CrearUsuarioUseCase(crearRepositorio(), cifrador).execute({ nombreCompleto: 'Otro', correo: 'ADMIN@demo.local', rol: 'lector', contrasena: 'Clave-segura1' }),
    ).rejects.toMatchObject({ codigo: 'CORREO_DUPLICADO' });
  });
});

describe('ActualizarUsuarioUseCase', () => {
  it('cambia solo el rol', async () => {
    const usuario = await new ActualizarUsuarioUseCase(crearRepositorio(), cifrador).execute(1, { rol: 'lector' });

    expect(usuario).toMatchObject({ id: 1, nombreCompleto: 'Admin Demo', rol: 'lector' });
  });

  it('deja guardar su mismo correo', async () => {
    const usuario = await new ActualizarUsuarioUseCase(crearRepositorio(), cifrador).execute(1, { correo: 'admin@demo.local' });

    expect(usuario.correo).toBe('admin@demo.local');
  });

  it('rechaza una actualizacion sin campos', async () => {
    await expect(new ActualizarUsuarioUseCase(crearRepositorio(), cifrador).execute(1, {})).rejects.toMatchObject({
      codigo: 'USUARIO_INVALIDO',
    });
  });

  it('avisa cuando el usuario no existe', async () => {
    await expect(new ActualizarUsuarioUseCase(crearRepositorio(), cifrador).execute(9, { rol: 'admin' })).rejects.toMatchObject({
      codigo: 'USUARIO_NO_ENCONTRADO',
    });
  });
});

describe('Contrasena y entidad de los usuarios', () => {
  it('al crear con contrasena la guarda cifrada y nunca en texto plano', async () => {
    const usuario = await new CrearUsuarioUseCase(crearRepositorio(), cifrador).execute({
      nombreCompleto: 'Ana',
      correo: 'ana@demo.local',
      rol: 'lector',
      entidad: '  Secretaria de Movilidad ',
      contrasena: 'Clave-segura1',
    });

    expect(usuario).toMatchObject({ entidad: 'Secretaria de Movilidad' });
    expect(usuario).not.toHaveProperty('contrasena');
    expect(contrasenasGuardadas.get(usuario.id)).toBe('cifrada:Clave-segura1');
  });

  it('sin contrasena no crea el usuario', async () => {
    await expect(
      new CrearUsuarioUseCase(crearRepositorio(), cifrador).execute({ nombreCompleto: 'Ana', correo: 'ana@demo.local', rol: 'lector' }),
    ).rejects.toMatchObject({ codigo: 'USUARIO_INVALIDO', message: expect.stringContaining('contraseña') });
  });

  it('rechaza contrasenas cortas o sin mayuscula minuscula o numero y acepta letras con tilde', async () => {
    const crear = (contrasena: string) =>
      new CrearUsuarioUseCase(crearRepositorio(), cifrador).execute({ nombreCompleto: 'Ana', correo: 'ana@demo.local', rol: 'lector', contrasena });

    for (const mala of ['Corta1', 'abcdefgh', 'abcdefg1', 'ABCDEFG1', 'Abcdefgh', 'A'.repeat(70) + 'b12']) {
      await expect(crear(mala)).rejects.toMatchObject({
        codigo: 'USUARIO_INVALIDO',
        message: 'La contraseña debe tener entre 8 y 72 caracteres, una mayúscula, una minúscula y un número',
      });
    }
    await expect(crear('Abcdefg1')).resolves.toMatchObject({ correo: 'ana@demo.local' });
    await expect(crear('ÑANDÚñandú9')).resolves.toMatchObject({ correo: 'ana@demo.local' });
  });

  it('al actualizar la contrasena la cifra y un texto vacio borra la entidad', async () => {
    const repositorio = crearRepositorio();
    const usuario = await new ActualizarUsuarioUseCase(repositorio, cifrador).execute(1, { contrasena: 'Nueva-clave1', entidad: '' });

    expect(contrasenasGuardadas.get(1)).toBe('cifrada:Nueva-clave1');
    expect(usuario.entidad).toBeNull();
  });
});

describe('Marca de cambiar la contrasena', () => {
  it('un usuario creado por el administrador debe cambiar su contrasena', async () => {
    const usuario = await new CrearUsuarioUseCase(crearRepositorio(), cifrador).execute({
      nombreCompleto: 'Ana Lopez',
      correo: 'ana@demo.local',
      rol: 'lector',
      contrasena: 'Clave-segura1',
    });

    expect(usuario.debeCambiarContrasena).toBe(true);
  });

  it('poner la contrasena de otro usuario lo obliga a cambiarla y la propia no', async () => {
    const repositorio = crearRepositorio();
    const actualizar = new ActualizarUsuarioUseCase(repositorio, cifrador);
    const otro = await new CrearUsuarioUseCase(repositorio, cifrador).execute({
      nombreCompleto: 'Ana Lopez',
      correo: 'ana@demo.local',
      rol: 'lector',
      contrasena: 'Clave-segura1',
    });
    await actualizar.execute(otro.id, { contrasena: 'Clave-propia1' }, otro.id);
    expect((await repositorio.buscarPorId(otro.id))?.debeCambiarContrasena).toBe(false);

    expect((await actualizar.execute(otro.id, { contrasena: 'Clave-temporal1' }, 1)).debeCambiarContrasena).toBe(true);
    expect((await actualizar.execute(1, { contrasena: 'Clave-del-admin1' }, 1)).debeCambiarContrasena).toBe(false);
  });

  it('cambiar otros datos sin contrasena no toca la marca', async () => {
    const usuario = await new ActualizarUsuarioUseCase(crearRepositorio(), cifrador).execute(1, { entidad: 'Alcaldía' }, 2);

    expect(usuario.debeCambiarContrasena).toBe(false);
  });
});

describe('CrearAdministradorInicialUseCase', () => {
  // Repositorio sin el administrador que trae crearRepositorio
  const repositorioVacio = async (): Promise<UsuariosRepositoryPort> => {
    const repositorio = crearRepositorio();
    await repositorio.eliminar(1);
    return repositorio;
  };

  it('sin correo ni contrasena no hace nada y no consulta la base', async () => {
    const repositorio = await repositorioVacio();
    const listar = jest.spyOn(repositorio, 'listar');

    expect(await new CrearAdministradorInicialUseCase(repositorio, cifrador).execute({})).toBe('sin-datos');
    expect(listar).not.toHaveBeenCalled();
  });

  it('con la base sin administradores lo crea con el correo en minusculas la contrasena cifrada y la marca', async () => {
    const repositorio = await repositorioVacio();

    const resultado = await new CrearAdministradorInicialUseCase(repositorio, cifrador).execute({ correo: 'Jefe@Entidad.gov.co', contrasena: 'Clave-inicial1' });

    const [admin] = await repositorio.listar({ rol: 'admin' });
    expect(resultado).toBe('creado');
    expect(admin).toMatchObject({ correo: 'jefe@entidad.gov.co', rol: 'admin', debeCambiarContrasena: true });
    expect(contrasenasGuardadas.get(admin.id)).toBe('cifrada:Clave-inicial1');
  });

  it('si ya existe un administrador no crea otro', async () => {
    const repositorio = crearRepositorio();

    const resultado = await new CrearAdministradorInicialUseCase(repositorio, cifrador).execute({ correo: 'otro@entidad.gov.co', contrasena: 'Clave-inicial1' });

    expect(resultado).toBe('ya-existe');
    expect(await repositorio.listar({ rol: 'admin' })).toHaveLength(1);
  });

  it('rechaza datos invalidos aunque ya exista un administrador', async () => {
    const crear = new CrearAdministradorInicialUseCase(crearRepositorio(), cifrador);

    await expect(crear.execute({ correo: 'jefe@entidad.gov.co', contrasena: 'debil' })).rejects.toMatchObject({ codigo: 'USUARIO_INVALIDO' });
    await expect(crear.execute({ correo: 'no-es-correo', contrasena: 'Clave-inicial1' })).rejects.toMatchObject({ codigo: 'USUARIO_INVALIDO' });
  });

  it('rechaza que falte una de las dos variables o una contrasena que no cumple las reglas', async () => {
    const crear = async (datos: { correo?: string; contrasena?: string }) =>
      new CrearAdministradorInicialUseCase(await repositorioVacio(), cifrador).execute(datos);

    await expect(crear({ correo: 'jefe@entidad.gov.co' })).rejects.toMatchObject({ codigo: 'USUARIO_INVALIDO' });
    await expect(crear({ contrasena: 'Clave-inicial1' })).rejects.toMatchObject({ codigo: 'USUARIO_INVALIDO' });
    await expect(crear({ correo: 'jefe@entidad.gov.co', contrasena: 'debil' })).rejects.toMatchObject({ codigo: 'USUARIO_INVALIDO' });
    await expect(crear({ correo: 'no-es-correo', contrasena: 'Clave-inicial1' })).rejects.toMatchObject({ codigo: 'USUARIO_INVALIDO' });
  });
});

describe('EliminarUsuarioUseCase', () => {
  it('elimina un usuario y la segunda vez avisa que ya no existe', async () => {
    const repositorio = crearRepositorio();
    await new EliminarUsuarioUseCase(repositorio).execute(1);

    await expect(new EliminarUsuarioUseCase(repositorio).execute(1)).rejects.toMatchObject({ codigo: 'USUARIO_NO_ENCONTRADO' });
  });
});
