import { CiudadanoConClave, CiudadanosRepositoryPort } from './ciudadanos.repository.port';
import { ConfirmarRestablecimientoUseCase } from './confirmar-restablecimiento.use-case';
import { ContrasenaCifradorPort } from './contrasena-cifrador.port';
import { CodigosRepositoryPort } from './codigos.repository.port';
import { AvisoCodigo, NotificadorCodigosPort } from './notificador-codigos.port';
import { SolicitarRestablecimientoUseCase } from './solicitar-restablecimiento.use-case';

const ana: CiudadanoConClave = {
  id: 1,
  nombreCompleto: 'Ana Lopez',
  correo: 'ana@demo.local',
  fechaNacimiento: '1995-04-23',
  genero: 'femenino',
  contrasenaCifrada: 'cifrada:vieja-clave-1',
  correoVerificado: true,
};

const ahora = new Date('2026-11-17T15:00:00Z');
const enSegundos = (segundos: number): Date => new Date(ahora.getTime() + segundos * 1000);

// Dobles en memoria: un solo ciudadano, un codigo fijo y un limite de intentos como el de la base de datos
function crearDobles() {
  const cuenta = { ...ana };
  const enviados: AvisoCodigo[] = [];
  const codigos = { vigente: null as { codigo: string; venceEn: Date; creadoEn: Date; intentos: number; usado: boolean } | null };
  const ciudadanos: CiudadanosRepositoryPort = {
    existeCorreo: async () => true,
    crear: async () => cuenta,
    buscarPorCorreo: async (correo) => (correo === cuenta.correo ? cuenta : null),
    cambiarContrasena: async (_id, cifrada) => {
      cuenta.contrasenaCifrada = cifrada;
    },
    marcarCorreoVerificado: async () => undefined,
  };
  const restablecimientos: CodigosRepositoryPort = {
    crear: async (_id, creadoEn, venceEn) => {
      codigos.vigente = { codigo: '1234', venceEn, creadoEn, intentos: 0, usado: false };
      return '1234';
    },
    haySolicitudDesde: async (_id, desde) => codigos.vigente !== null && codigos.vigente.creadoEn > desde,
    consumir: async (_id, codigo, hoy) => {
      const actual = codigos.vigente;
      if (actual && !actual.usado && actual.venceEn > hoy && actual.intentos < 5 && actual.codigo === codigo) {
        actual.usado = true;
        return true;
      }
      if (actual && !actual.usado) actual.intentos++;
      return false;
    },
  };
  const notificador: NotificadorCodigosPort = { enviarRestablecimiento: async (aviso) => void enviados.push(aviso), enviarVerificacion: async () => undefined };
  const cifrador: ContrasenaCifradorPort = { cifrar: async (c) => `cifrada:${c}`, coincide: async (c, cifrada) => cifrada === `cifrada:${c}` };
  return { cuenta, enviados, ciudadanos, restablecimientos, notificador, cifrador };
}

describe('SolicitarRestablecimientoUseCase', () => {
  it('envia el codigo al correo del ciudadano', async () => {
    const d = crearDobles();

    await new SolicitarRestablecimientoUseCase(d.ciudadanos, d.restablecimientos, d.notificador).execute({ correo: ' Ana@Demo.local ', ahora });

    expect(d.enviados).toEqual([{ correo: 'ana@demo.local', nombreCompleto: 'Ana Lopez', codigo: '1234', venceEn: enSegundos(15 * 60) }]);
  });

  it('no envia nada ni avisa si el correo no esta registrado', async () => {
    const d = crearDobles();

    await expect(new SolicitarRestablecimientoUseCase(d.ciudadanos, d.restablecimientos, d.notificador).execute({ correo: 'nadie@demo.local', ahora })).resolves.toBeUndefined();

    expect(d.enviados).toHaveLength(0);
  });

  it('no manda otro correo si pidio un codigo hace menos de un minuto pero si despues', async () => {
    const d = crearDobles();
    const caso = new SolicitarRestablecimientoUseCase(d.ciudadanos, d.restablecimientos, d.notificador);

    await caso.execute({ correo: 'ana@demo.local', ahora });
    await caso.execute({ correo: 'ana@demo.local', ahora: enSegundos(30) });
    expect(d.enviados).toHaveLength(1);

    await caso.execute({ correo: 'ana@demo.local', ahora: enSegundos(90) });
    expect(d.enviados).toHaveLength(2);
  });
});

describe('ConfirmarRestablecimientoUseCase', () => {
  async function conCodigoPedido() {
    const d = crearDobles();
    await new SolicitarRestablecimientoUseCase(d.ciudadanos, d.restablecimientos, d.notificador).execute({ correo: 'ana@demo.local', ahora });
    return { ...d, caso: new ConfirmarRestablecimientoUseCase(d.ciudadanos, d.restablecimientos, d.cifrador) };
  }
  const comando = { correo: 'ana@demo.local', codigo: '1234', contrasenaNueva: 'clave-nueva-1', ahora: enSegundos(60) };

  it('cambia la contrasena cifrada con el codigo correcto', async () => {
    const { caso, cuenta } = await conCodigoPedido();

    await caso.execute(comando);

    expect(cuenta.contrasenaCifrada).toBe('cifrada:clave-nueva-1');
  });

  it('el codigo sirve una sola vez', async () => {
    const { caso } = await conCodigoPedido();
    await caso.execute(comando);

    await expect(caso.execute(comando)).rejects.toMatchObject({ codigo: 'RESTABLECIMIENTO_INVALIDO' });
  });

  it('rechaza un codigo equivocado o vencido y deja la contrasena como estaba', async () => {
    const { caso, cuenta } = await conCodigoPedido();

    await expect(caso.execute({ ...comando, codigo: '0000' })).rejects.toMatchObject({ codigo: 'RESTABLECIMIENTO_INVALIDO' });
    await expect(caso.execute({ ...comando, ahora: enSegundos(16 * 60) })).rejects.toMatchObject({ codigo: 'RESTABLECIMIENTO_INVALIDO' });

    expect(cuenta.contrasenaCifrada).toBe('cifrada:vieja-clave-1');
  });

  it('despues de cinco codigos equivocados ya no sirve ni el correcto', async () => {
    const { caso } = await conCodigoPedido();
    for (let i = 0; i < 5; i++) {
      await expect(caso.execute({ ...comando, codigo: '0000' })).rejects.toMatchObject({ codigo: 'RESTABLECIMIENTO_INVALIDO' });
    }

    await expect(caso.execute(comando)).rejects.toMatchObject({ codigo: 'RESTABLECIMIENTO_INVALIDO' });
  });

  it('responde igual con un correo que no existe', async () => {
    const { caso } = await conCodigoPedido();

    await expect(caso.execute({ ...comando, correo: 'nadie@demo.local' })).rejects.toMatchObject({ codigo: 'RESTABLECIMIENTO_INVALIDO' });
  });

  it('revisa la contrasena nueva antes de gastar el codigo', async () => {
    const { caso, cuenta } = await conCodigoPedido();

    await expect(caso.execute({ ...comando, contrasenaNueva: 'corta' })).rejects.toMatchObject({ codigo: 'CIUDADANO_INVALIDO' });
    await caso.execute(comando);

    expect(cuenta.contrasenaCifrada).toBe('cifrada:clave-nueva-1');
  });
});
