import { CredencialesInvalidasError } from '../domain/credenciales-invalidas.error';
import { CuentaUsuario } from '../domain/usuario';
import { CambiarContrasenaUseCase } from './cambiar-contrasena.use-case';
import { ConfirmarRestablecimientoUseCase } from './confirmar-restablecimiento.use-case';
import { ContrasenaCifradorPort } from './contrasena-cifrador.port';
import { LoginUseCase } from './login.use-case';
import { AvisoRestablecimiento, NotificadorRestablecimientoPort } from './notificador-restablecimiento.port';
import { RestablecimientosRepositoryPort } from './restablecimientos.repository.port';
import { SolicitarRestablecimientoUseCase } from './solicitar-restablecimiento.use-case';
import { TokenEmisorPort } from './token-emisor.port';
import { UsuarioRepositoryPort } from './usuario.repository.port';

// Cifrador falso donde cifrar es anteponer cifrada asi se ve que nada queda en texto plano
const cifrador: ContrasenaCifradorPort = {
  cifrar: async (contrasena) => `cifrada:${contrasena}`,
  coincide: async (contrasena, cifrada) => cifrada === `cifrada:${contrasena}`,
};

// Emisor falso que deja ver con que id y rol se pidio el token
const tokens: TokenEmisorPort = { emitir: (id, rol) => `token-${id}-${rol}` };

// Repositorio falso con un usuario con contrasena y otro creado sin contrasena
function crearUsuarios(): UsuarioRepositoryPort & { cuentas: CuentaUsuario[]; ingresos: number[] } {
  const ingresos: number[] = [];
  const cuentas: CuentaUsuario[] = [
    { id: 7, nombreCompleto: 'Ana Prueba', correo: 'ana@prueba.local', rol: 'admin', entidad: 'Movilidad', contrasenaCifrada: 'cifrada:secreta1' },
    { id: 8, nombreCompleto: 'Sin Clave', correo: 'sin@prueba.local', rol: 'lector', entidad: null, contrasenaCifrada: null },
  ];
  return {
    cuentas,
    ingresos,
    buscarPorCorreo: async (correo) => cuentas.find((c) => c.correo === correo) ?? null,
    buscarPorId: async (id) => cuentas.find((c) => c.id === id) ?? null,
    registrarIngreso: async (id) => void ingresos.push(id),
    cambiarContrasena: async (id, cifrada) => {
      (cuentas.find((c) => c.id === id) as CuentaUsuario).contrasenaCifrada = cifrada;
    },
  };
}

// Repositorio falso de enlaces que vencen y sirven una sola vez
function crearRestablecimientos(): RestablecimientosRepositoryPort {
  const enlaces = new Map<string, { usuarioId: number; venceEn: Date; usado: boolean }>();
  return {
    crear: async (usuarioId, venceEn) => {
      const token = `token-${enlaces.size + 1}`;
      enlaces.set(token, { usuarioId, venceEn, usado: false });
      return token;
    },
    consumir: async (token, ahora) => {
      const enlace = enlaces.get(token);
      if (enlace === undefined || enlace.usado || enlace.venceEn <= ahora) return null;
      enlace.usado = true;
      return enlace.usuarioId;
    },
  };
}

describe('LoginUseCase', () => {
  const login = (usuarios = crearUsuarios()) => new LoginUseCase(usuarios, cifrador, tokens);

  it('devuelve el token con el rol y los datos del usuario con credenciales correctas y guarda el ingreso', async () => {
    const usuarios = crearUsuarios();
    const resultado = await login(usuarios).execute({ correo: '  ANA@prueba.local ', contrasena: 'secreta1' });

    expect(resultado).toEqual({
      token: 'token-7-admin',
      usuario: { id: '7', nombreCompleto: 'Ana Prueba', correo: 'ana@prueba.local', rol: 'admin', entidad: 'Movilidad' },
    });
    expect(usuarios.ingresos).toEqual([7]);
  });

  it('lanza CredencialesInvalidasError con una contrasena incorrecta un correo que no existe o un usuario sin contrasena', async () => {
    await expect(login().execute({ correo: 'ana@prueba.local', contrasena: 'otra' })).rejects.toBeInstanceOf(CredencialesInvalidasError);
    await expect(login().execute({ correo: 'nadie@prueba.local', contrasena: 'secreta1' })).rejects.toBeInstanceOf(CredencialesInvalidasError);
    await expect(login().execute({ correo: 'sin@prueba.local', contrasena: 'secreta1' })).rejects.toBeInstanceOf(CredencialesInvalidasError);
  });
});

describe('Restablecer la contrasena', () => {
  const AHORA = new Date('2026-11-12T10:00:00Z');
  const DOS_HORAS_MS = 2 * 60 * 60 * 1000;

  function preparar() {
    const usuarios = crearUsuarios();
    const restablecimientos = crearRestablecimientos();
    const avisos: AvisoRestablecimiento[] = [];
    const notificador: NotificadorRestablecimientoPort = { enviar: async (aviso) => void avisos.push(aviso) };
    return {
      usuarios,
      avisos,
      solicitar: new SolicitarRestablecimientoUseCase(usuarios, restablecimientos, notificador),
      confirmar: new ConfirmarRestablecimientoUseCase(usuarios, restablecimientos, cifrador),
      login: new LoginUseCase(usuarios, cifrador, tokens),
    };
  }

  it('envia un enlace que vence en una hora y con el la nueva contrasena sirve para entrar', async () => {
    const { avisos, solicitar, confirmar, login } = preparar();

    await solicitar.execute({ correo: 'Ana@prueba.local', ahora: AHORA });
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toMatchObject({ correo: 'ana@prueba.local', venceEn: new Date('2026-11-12T11:00:00Z') });

    await confirmar.execute({ token: avisos[0].token, contrasenaNueva: 'Nueva-clave1', ahora: AHORA });
    await expect(login.execute({ correo: 'ana@prueba.local', contrasena: 'Nueva-clave1' })).resolves.toMatchObject({ token: 'token-7-admin' });
    await expect(login.execute({ correo: 'ana@prueba.local', contrasena: 'secreta1' })).rejects.toBeInstanceOf(CredencialesInvalidasError);
  });

  it('un usuario creado sin contrasena puede ponerse una con el enlace', async () => {
    const { avisos, solicitar, confirmar, login } = preparar();

    await solicitar.execute({ correo: 'sin@prueba.local', ahora: AHORA });
    await confirmar.execute({ token: avisos[0].token, contrasenaNueva: 'Primera-clave1', ahora: AHORA });

    await expect(login.execute({ correo: 'sin@prueba.local', contrasena: 'Primera-clave1' })).resolves.toMatchObject({ token: 'token-8-lector' });
  });

  it('con un correo que no existe no envia nada ni falla', async () => {
    const { avisos, solicitar } = preparar();

    await solicitar.execute({ correo: 'nadie@prueba.local', ahora: AHORA });

    expect(avisos).toHaveLength(0);
  });

  it('el enlace no sirve dos veces ni despues de vencer ni con un token inventado', async () => {
    const { avisos, solicitar, confirmar } = preparar();
    await solicitar.execute({ correo: 'ana@prueba.local', ahora: AHORA });
    await solicitar.execute({ correo: 'ana@prueba.local', ahora: AHORA });
    const [primero, segundo] = avisos;

    await confirmar.execute({ token: primero.token, contrasenaNueva: 'Nueva-clave1', ahora: AHORA });

    const invalido = { codigo: 'RESTABLECIMIENTO_INVALIDO' };
    await expect(confirmar.execute({ token: primero.token, contrasenaNueva: 'Otra-clave1', ahora: AHORA })).rejects.toMatchObject(invalido);
    const tarde = new Date(AHORA.getTime() + DOS_HORAS_MS);
    await expect(confirmar.execute({ token: segundo.token, contrasenaNueva: 'Otra-clave1', ahora: tarde })).rejects.toMatchObject(invalido);
    await expect(confirmar.execute({ token: 'inventado', contrasenaNueva: 'Otra-clave1', ahora: AHORA })).rejects.toMatchObject(invalido);
  });

  it('una contrasena corta se rechaza sin gastar el enlace', async () => {
    const { avisos, solicitar, confirmar } = preparar();
    await solicitar.execute({ correo: 'ana@prueba.local', ahora: AHORA });

    await expect(confirmar.execute({ token: avisos[0].token, contrasenaNueva: 'corta', ahora: AHORA })).rejects.toMatchObject({
      codigo: 'RESTABLECIMIENTO_INVALIDO',
    });
    await expect(confirmar.execute({ token: avisos[0].token, contrasenaNueva: 'Ya-es-larga1', ahora: AHORA })).resolves.toBeUndefined();
  });
});

describe('CambiarContrasenaUseCase', () => {
  it('cambia la contrasena si la actual es correcta y la nueva cumple las reglas', async () => {
    const usuarios = crearUsuarios();
    const cambiar = new CambiarContrasenaUseCase(usuarios, cifrador);

    await cambiar.execute({ usuarioId: 7, contrasenaActual: 'secreta1', contrasenaNueva: 'Nueva-clave1' });

    await expect(new LoginUseCase(usuarios, cifrador, tokens).execute({ correo: 'ana@prueba.local', contrasena: 'Nueva-clave1' })).resolves.toBeDefined();
  });

  it('con la actual errada lanza CredencialesInvalidasError y con una nueva debil CONTRASENA_INVALIDA', async () => {
    const cambiar = new CambiarContrasenaUseCase(crearUsuarios(), cifrador);

    await expect(cambiar.execute({ usuarioId: 7, contrasenaActual: 'otra', contrasenaNueva: 'Nueva-clave1' })).rejects.toBeInstanceOf(CredencialesInvalidasError);
    await expect(cambiar.execute({ usuarioId: 7, contrasenaActual: 'secreta1', contrasenaNueva: 'debil' })).rejects.toMatchObject({ codigo: 'CONTRASENA_INVALIDA' });
  });
});
