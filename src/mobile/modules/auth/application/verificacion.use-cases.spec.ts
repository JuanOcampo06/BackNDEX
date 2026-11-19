import { CiudadanoConClave, CiudadanosRepositoryPort } from './ciudadanos.repository.port';
import { CodigosRepositoryPort } from './codigos.repository.port';
import { AvisoCodigo, NotificadorCodigosPort } from './notificador-codigos.port';
import { SolicitarVerificacionUseCase } from './solicitar-verificacion.use-case';
import { VerificarCorreoUseCase } from './verificar-correo.use-case';

const ahora = new Date('2026-11-17T15:00:00Z');
const enSegundos = (segundos: number): Date => new Date(ahora.getTime() + segundos * 1000);

// Dobles en memoria: un solo ciudadano sin verificar, un codigo fijo y un limite de intentos como el de la base de datos
function crearDobles(correoVerificado = false) {
  const cuenta: CiudadanoConClave = {
    id: 1,
    nombreCompleto: 'Ana Lopez',
    correo: 'ana@demo.local',
    fechaNacimiento: '1995-04-23',
    genero: 'femenino',
    contrasenaCifrada: 'cifrada:clave-segura-1',
    correoVerificado,
  };
  const enviados: AvisoCodigo[] = [];
  const codigo = { actual: null as { texto: string; venceEn: Date; creadoEn: Date; intentos: number; usado: boolean } | null };
  const ciudadanos: CiudadanosRepositoryPort = {
    existeCorreo: async () => true,
    crear: async () => cuenta,
    buscarPorCorreo: async (correo) => (correo === cuenta.correo ? cuenta : null),
    cambiarContrasena: async () => undefined,
    marcarCorreoVerificado: async () => {
      cuenta.correoVerificado = true;
    },
  };
  const verificaciones: CodigosRepositoryPort = {
    crear: async (_id, creadoEn, venceEn) => {
      codigo.actual = { texto: '654321', venceEn, creadoEn, intentos: 0, usado: false };
      return '654321';
    },
    haySolicitudDesde: async (_id, desde) => codigo.actual !== null && codigo.actual.creadoEn > desde,
    consumir: async (_id, texto, hoy) => {
      const actual = codigo.actual;
      if (actual && !actual.usado && actual.venceEn > hoy && actual.intentos < 5 && actual.texto === texto) {
        actual.usado = true;
        return true;
      }
      if (actual && !actual.usado) actual.intentos++;
      return false;
    },
  };
  const notificador: NotificadorCodigosPort = {
    enviarRestablecimiento: async () => undefined,
    enviarVerificacion: async (aviso) => void enviados.push(aviso),
  };
  return { cuenta, enviados, ciudadanos, verificaciones, notificador, tokens: { emitir: (id: number) => `token-${id}` } };
}

describe('SolicitarVerificacionUseCase', () => {
  it('envia el codigo de verificacion al correo del ciudadano', async () => {
    const d = crearDobles();

    await new SolicitarVerificacionUseCase(d.ciudadanos, d.verificaciones, d.notificador).execute({ correo: ' Ana@Demo.local ', ahora });

    expect(d.enviados).toEqual([{ correo: 'ana@demo.local', nombreCompleto: 'Ana Lopez', codigo: '654321', venceEn: enSegundos(15 * 60) }]);
  });

  it('no envia nada si el correo no esta registrado o ya esta verificado', async () => {
    const sinVerificar = crearDobles();
    const verificado = crearDobles(true);

    await new SolicitarVerificacionUseCase(sinVerificar.ciudadanos, sinVerificar.verificaciones, sinVerificar.notificador).execute({ correo: 'nadie@demo.local', ahora });
    await new SolicitarVerificacionUseCase(verificado.ciudadanos, verificado.verificaciones, verificado.notificador).execute({ correo: 'ana@demo.local', ahora });

    expect(sinVerificar.enviados).toHaveLength(0);
    expect(verificado.enviados).toHaveLength(0);
  });

  it('no manda otro correo si pidio un codigo hace menos de un minuto pero si despues', async () => {
    const d = crearDobles();
    const caso = new SolicitarVerificacionUseCase(d.ciudadanos, d.verificaciones, d.notificador);

    await caso.execute({ correo: 'ana@demo.local', ahora });
    await caso.execute({ correo: 'ana@demo.local', ahora: enSegundos(30) });
    expect(d.enviados).toHaveLength(1);

    await caso.execute({ correo: 'ana@demo.local', ahora: enSegundos(90) });
    expect(d.enviados).toHaveLength(2);
  });
});

describe('VerificarCorreoUseCase', () => {
  async function conCodigoPedido() {
    const d = crearDobles();
    await new SolicitarVerificacionUseCase(d.ciudadanos, d.verificaciones, d.notificador).execute({ correo: 'ana@demo.local', ahora });
    return { ...d, caso: new VerificarCorreoUseCase(d.ciudadanos, d.verificaciones, d.tokens) };
  }
  const comando = { correo: 'ana@demo.local', codigo: '654321', ahora: enSegundos(60) };

  it('con el codigo correcto verifica el correo y entrega la sesion sin la contrasena', async () => {
    const { caso, cuenta } = await conCodigoPedido();

    const sesion = await caso.execute(comando);

    expect(cuenta.correoVerificado).toBe(true);
    expect(sesion).toEqual({
      accessToken: 'token-1',
      ciudadano: { id: 1, nombreCompleto: 'Ana Lopez', correo: 'ana@demo.local', fechaNacimiento: '1995-04-23', genero: 'femenino' },
    });
  });

  it('el codigo sirve una sola vez', async () => {
    const { caso } = await conCodigoPedido();
    await caso.execute(comando);

    await expect(caso.execute(comando)).rejects.toMatchObject({ codigo: 'VERIFICACION_INVALIDA' });
  });

  it('rechaza un codigo equivocado o vencido y deja el correo sin verificar', async () => {
    const { caso, cuenta } = await conCodigoPedido();

    await expect(caso.execute({ ...comando, codigo: '000000' })).rejects.toMatchObject({ codigo: 'VERIFICACION_INVALIDA' });
    await expect(caso.execute({ ...comando, ahora: enSegundos(16 * 60) })).rejects.toMatchObject({ codigo: 'VERIFICACION_INVALIDA' });

    expect(cuenta.correoVerificado).toBe(false);
  });

  it('despues de cinco codigos equivocados ya no sirve ni el correcto', async () => {
    const { caso } = await conCodigoPedido();
    for (let i = 0; i < 5; i++) {
      await expect(caso.execute({ ...comando, codigo: '000000' })).rejects.toMatchObject({ codigo: 'VERIFICACION_INVALIDA' });
    }

    await expect(caso.execute(comando)).rejects.toMatchObject({ codigo: 'VERIFICACION_INVALIDA' });
  });

  it('responde igual con un correo que no existe', async () => {
    const { caso } = await conCodigoPedido();

    await expect(caso.execute({ ...comando, correo: 'nadie@demo.local' })).rejects.toMatchObject({ codigo: 'VERIFICACION_INVALIDA' });
  });
});
