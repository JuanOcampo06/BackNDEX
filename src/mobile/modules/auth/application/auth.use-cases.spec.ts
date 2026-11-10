import { CiudadanoConClave, CiudadanosRepositoryPort } from './ciudadanos.repository.port';
import { ContrasenaCifradorPort } from './contrasena-cifrador.port';
import { IniciarSesionUseCase } from './iniciar-sesion.use-case';
import { RegistrarCiudadanoUseCase } from './registrar-ciudadano.use-case';
import { TokenEmisorPort } from './token-emisor.port';

// Repositorio falso en memoria y cifrador falso que solo antepone un prefijo
function crearDobles(): { ciudadanos: CiudadanosRepositoryPort; cifrador: ContrasenaCifradorPort; tokens: TokenEmisorPort } {
  const guardados: CiudadanoConClave[] = [];
  return {
    ciudadanos: {
      existeCorreo: async (correo) => guardados.some((c) => c.correo === correo),
      crear: async (ciudadano, contrasenaCifrada) => {
        const id = guardados.length + 1;
        guardados.push({ id, ...ciudadano, contrasenaCifrada });
        return { id, ...ciudadano };
      },
      buscarPorCorreo: async (correo) => guardados.find((c) => c.correo === correo) ?? null,
    },
    cifrador: {
      cifrar: async (contrasena) => `cifrada:${contrasena}`,
      coincide: async (contrasena, cifrada) => cifrada === `cifrada:${contrasena}`,
    },
    tokens: { emitir: (id) => `token-${id}` },
  };
}

const datos = {
  nombreCompleto: ' Ana Lopez ',
  correo: 'Ana@Demo.local',
  telefono: '3001234567',
  contrasena: 'clave-segura-1',
  fechaNacimiento: '1995-04-23',
  genero: 'femenino',
};

const ciudadanoDeAna = {
  id: 1,
  nombreCompleto: 'Ana Lopez',
  correo: 'ana@demo.local',
  telefono: '3001234567',
  fechaNacimiento: '1995-04-23',
  genero: 'femenino',
};

describe('RegistrarCiudadanoUseCase', () => {
  it('registra al ciudadano con el correo en minusculas y le da un token', async () => {
    const { ciudadanos, cifrador, tokens } = crearDobles();

    const sesion = await new RegistrarCiudadanoUseCase(ciudadanos, cifrador, tokens).execute(datos);

    expect(sesion).toEqual({ accessToken: 'token-1', ciudadano: ciudadanoDeAna });
  });

  it('guarda la contrasena cifrada y nunca en texto plano', async () => {
    const { ciudadanos, cifrador, tokens } = crearDobles();
    await new RegistrarCiudadanoUseCase(ciudadanos, cifrador, tokens).execute(datos);

    const guardado = await ciudadanos.buscarPorCorreo('ana@demo.local');

    expect(guardado?.contrasenaCifrada).toBe('cifrada:clave-segura-1');
  });

  it('rechaza un correo que ya esta registrado', async () => {
    const { ciudadanos, cifrador, tokens } = crearDobles();
    const registrar = new RegistrarCiudadanoUseCase(ciudadanos, cifrador, tokens);
    await registrar.execute(datos);

    await expect(registrar.execute(datos)).rejects.toMatchObject({ codigo: 'CORREO_DUPLICADO' });
  });

  it('rechaza una contrasena corta, un correo mal escrito y un telefono invalido', async () => {
    const { ciudadanos, cifrador, tokens } = crearDobles();
    const registrar = new RegistrarCiudadanoUseCase(ciudadanos, cifrador, tokens);

    await expect(registrar.execute({ ...datos, contrasena: 'corta' })).rejects.toMatchObject({ codigo: 'CIUDADANO_INVALIDO' });
    await expect(registrar.execute({ ...datos, correo: 'sin-arroba' })).rejects.toMatchObject({ codigo: 'CIUDADANO_INVALIDO' });
    await expect(registrar.execute({ ...datos, telefono: 'abc' })).rejects.toMatchObject({ codigo: 'CIUDADANO_INVALIDO' });
  });
});

describe('IniciarSesionUseCase', () => {
  async function conCiudadanoRegistrado(): Promise<IniciarSesionUseCase> {
    const { ciudadanos, cifrador, tokens } = crearDobles();
    await new RegistrarCiudadanoUseCase(ciudadanos, cifrador, tokens).execute(datos);
    return new IniciarSesionUseCase(ciudadanos, cifrador, tokens);
  }

  it('entrega el token y los datos publicos sin la contrasena', async () => {
    const iniciarSesion = await conCiudadanoRegistrado();

    const sesion = await iniciarSesion.execute({ correo: 'ANA@demo.local', contrasena: 'clave-segura-1' });

    expect(sesion).toEqual({ accessToken: 'token-1', ciudadano: ciudadanoDeAna });
  });

  it('responde lo mismo si falla la contrasena o si el correo no existe', async () => {
    const iniciarSesion = await conCiudadanoRegistrado();

    await expect(iniciarSesion.execute({ correo: 'ana@demo.local', contrasena: 'otra-clave' })).rejects.toMatchObject({
      codigo: 'CREDENCIALES_INVALIDAS',
    });
    await expect(iniciarSesion.execute({ correo: 'nadie@demo.local', contrasena: 'clave-segura-1' })).rejects.toMatchObject({
      codigo: 'CREDENCIALES_INVALIDAS',
    });
  });
});

describe('fecha de nacimiento y genero al registrarse', () => {
  const HOY = new Date('2026-11-09T15:00:00.000Z');

  function registrar(extra: Record<string, string | undefined>, hoy: Date = HOY) {
    const { ciudadanos, cifrador, tokens } = crearDobles();
    return new RegistrarCiudadanoUseCase(ciudadanos, cifrador, tokens, () => hoy).execute({ ...datos, ...extra });
  }

  it('guarda la fecha y el genero y los devuelve', async () => {
    const sesion = await registrar({ genero: 'prefiero_no_decirlo', fechaNacimiento: '1990-01-31' });

    expect(sesion.ciudadano).toMatchObject({ fechaNacimiento: '1990-01-31', genero: 'prefiero_no_decirlo' });
  });

  it('acepta a quien cumple 18 anos hoy y a quien ya paso de ese dia', async () => {
    await expect(registrar({ fechaNacimiento: '2008-11-09' })).resolves.toBeDefined();
    await expect(registrar({ fechaNacimiento: '2008-11-08' })).resolves.toBeDefined();
  });

  it('rechaza a quien cumple 18 anos manana y a un menor', async () => {
    await expect(registrar({ fechaNacimiento: '2008-11-10' })).rejects.toMatchObject({
      codigo: 'CIUDADANO_INVALIDO',
      message: expect.stringContaining('mayor de edad'),
    });
    await expect(registrar({ fechaNacimiento: '2015-01-01' })).rejects.toMatchObject({ codigo: 'CIUDADANO_INVALIDO' });
  });

  it('quien nacio un 29 de febrero cumple el 1 de marzo en los anos que no son bisiestos', async () => {
    const antes = new Date('2026-02-28T12:00:00.000Z');
    const despues = new Date('2026-03-01T12:00:00.000Z');

    await expect(registrar({ fechaNacimiento: '2008-02-29' }, antes)).rejects.toMatchObject({ codigo: 'CIUDADANO_INVALIDO' });
    await expect(registrar({ fechaNacimiento: '2008-02-29' }, despues)).resolves.toBeDefined();
  });

  it('rechaza una fecha que no existe, mal escrita, futura o anterior a 1900', async () => {
    for (const fechaNacimiento of ['2000-02-30', '2001-13-01', '23/04/1995', '1995-4-23', '2030-01-01', '1899-12-31', '0050-01-01', '']) {
      await expect(registrar({ fechaNacimiento })).rejects.toMatchObject({ codigo: 'CIUDADANO_INVALIDO' });
    }
  });

  it('rechaza un genero que la app no ofrece', async () => {
    await expect(registrar({ genero: 'Femenino' })).rejects.toMatchObject({ codigo: 'CIUDADANO_INVALIDO' });
    await expect(registrar({ genero: 'otro' })).rejects.toMatchObject({ codigo: 'CIUDADANO_INVALIDO' });
  });

  it('la fecha de nacimiento y el genero son obligatorios', async () => {
    await expect(registrar({ fechaNacimiento: undefined })).rejects.toMatchObject({ codigo: 'CIUDADANO_INVALIDO' });
    await expect(registrar({ genero: undefined })).rejects.toMatchObject({ codigo: 'CIUDADANO_INVALIDO' });
  });
});
