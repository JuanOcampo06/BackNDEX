import { ContactoEmergencia, EstadoContacto } from '../domain/contacto';
import { ActualizarContactoUseCase } from './actualizar-contacto.use-case';
import { AgregarContactoUseCase } from './agregar-contacto.use-case';
import { ContactosRepositoryPort, Invitacion } from './contactos.repository.port';
import { EliminarContactoUseCase } from './eliminar-contacto.use-case';
import { ListarContactosUseCase } from './listar-contactos.use-case';
import { AvisoInvitacion, NotificadorInvitacionesPort } from './notificador-invitaciones.port';
import { OrdenarContactosUseCase } from './ordenar-contactos.use-case';
import { ReenviarInvitacionUseCase } from './reenviar-invitacion.use-case';
import { ResponderInvitacionUseCase } from './responder-invitacion.use-case';

interface Fila {
  usuarioId: number;
  orden: number;
  contacto: ContactoEmergencia;
  token: string | null;
  enviadaEn: Date | null;
  venceEn: Date | null;
}

// Repositorio en memoria donde existen los ciudadanos 1 (Ana Lopez) y 2 (Beto Diaz)
function repositorioEnMemoria(): ContactosRepositoryPort {
  const nombres: Record<number, string> = { 1: 'Ana Lopez', 2: 'Beto Diaz' };
  const filas: Fila[] = [];
  let siguienteId = 1;
  let siguienteToken = 1;
  const delUsuario = (usuarioId: number) => filas.filter((f) => f.usuarioId === usuarioId).sort((a, b) => a.orden - b.orden);
  const fila = (usuarioId: number, id: number) => filas.find((f) => f.usuarioId === usuarioId && f.contacto.id === id);
  return {
    listar: async (usuarioId) => delUsuario(usuarioId).map((f) => ({ ...f.contacto })),
    crear: async (usuarioId, nuevo) => {
      if (nombres[usuarioId] === undefined) return null;
      const contacto = { ...nuevo, id: siguienteId++ };
      filas.push({ usuarioId, orden: delUsuario(usuarioId).length, contacto, token: null, enviadaEn: null, venceEn: null });
      return { ...contacto };
    },
    actualizar: async (usuarioId, contacto) => {
      const f = fila(usuarioId, contacto.id);
      if (f) f.contacto = { ...contacto };
    },
    eliminar: async (usuarioId, contactoId) => {
      const i = filas.findIndex((f) => f.usuarioId === usuarioId && f.contacto.id === contactoId);
      if (i === -1) return false;
      filas.splice(i, 1);
      return true;
    },
    ordenar: async (usuarioId, ids) => {
      ids.forEach((id, orden) => {
        const f = fila(usuarioId, id);
        if (f) f.orden = orden;
      });
    },
    nombreDelCiudadano: async (usuarioId) => nombres[usuarioId] ?? null,
    nuevaInvitacion: async (contactoId, fechas) => {
      const f = filas.find((x) => x.contacto.id === contactoId);
      const token = `token-${siguienteToken++}`;
      if (f) Object.assign(f, { token, enviadaEn: fechas.enviadaEn, venceEn: fechas.venceEn });
      return token;
    },
    invitacionEnviadaEn: async (usuarioId, contactoId) => fila(usuarioId, contactoId)?.enviadaEn ?? null,
    buscarInvitacion: async (token): Promise<Invitacion | null> => {
      const f = filas.find((x) => x.token === token);
      return f && f.venceEn
        ? { contactoId: f.contacto.id, ciudadano: nombres[f.usuarioId], contacto: f.contacto.nombre, estado: f.contacto.estado, venceEn: f.venceEn }
        : null;
    },
    responderInvitacion: async (contactoId, estado: EstadoContacto) => {
      const f = filas.find((x) => x.contacto.id === contactoId);
      if (f) Object.assign(f, { token: null, contacto: { ...f.contacto, estado } });
    },
  };
}

// Notificador que guarda los correos en vez de enviarlos
function notificadorFalso(): NotificadorInvitacionesPort & { enviados: AvisoInvitacion[] } {
  const enviados: AvisoInvitacion[] = [];
  return { enviados, enviarInvitacion: async (aviso) => void enviados.push(aviso) };
}

const datos = (nombre: string) => ({ nombre, parentesco: '', telefono: '3001234567', correo: `${nombre.toLowerCase()}@correo.com` });
const inicio = new Date('2026-11-23T12:00:00Z');
const enSegundos = (segundos: number) => () => new Date(inicio.getTime() + segundos * 1000);

describe('Contactos de emergencia del ciudadano', () => {
  it('agrega pendientes, con colores distintos y en orden, y les envia la invitacion; maximo 3', async () => {
    const repositorio = repositorioEnMemoria();
    const notificador = notificadorFalso();
    const agregar = new AgregarContactoUseCase(repositorio, notificador, enSegundos(0));
    await agregar.execute(1, datos('Caro'));
    await agregar.execute(1, datos('Dani'));
    await agregar.execute(1, datos('Eva'));

    const lista = await new ListarContactosUseCase(repositorio).execute(1);

    expect(lista.map((c) => [c.nombre, c.color, c.estado])).toEqual([
      ['Caro', 0, 'pendiente'],
      ['Dani', 1, 'pendiente'],
      ['Eva', 2, 'pendiente'],
    ]);
    expect(notificador.enviados[0]).toMatchObject({ correo: 'caro@correo.com', nombreContacto: 'Caro', nombreCiudadano: 'Ana Lopez', token: 'token-1' });
    expect(notificador.enviados[0].venceEn).toEqual(new Date('2026-11-30T12:00:00Z'));
    await expect(agregar.execute(1, datos('Fer'))).rejects.toMatchObject({ codigo: 'LIMITE_DE_CONTACTOS' });
  });

  it('el contacto acepta o rechaza desde el enlace y el enlace deja de servir', async () => {
    const repositorio = repositorioEnMemoria();
    const notificador = notificadorFalso();
    const agregar = new AgregarContactoUseCase(repositorio, notificador, enSegundos(0));
    await agregar.execute(1, datos('Caro'));
    await agregar.execute(1, datos('Dani'));
    const responder = new ResponderInvitacionUseCase(repositorio, enSegundos(60));

    expect(await responder.ver('token-1')).toEqual({ ciudadano: 'Ana Lopez', contacto: 'Caro' });
    await responder.execute('token-1', 'acepto');
    await responder.execute('token-2', 'rechazo');

    const lista = await new ListarContactosUseCase(repositorio).execute(1);
    expect(lista.map((c) => c.estado)).toEqual(['aceptado', 'rechazado']);
    await expect(responder.execute('token-1', 'rechazo')).rejects.toMatchObject({ codigo: 'INVITACION_INVALIDA' });
    await expect(responder.ver('no-existe')).rejects.toMatchObject({ codigo: 'INVITACION_INVALIDA' });
  });

  it('una invitacion vencida no sirve', async () => {
    const repositorio = repositorioEnMemoria();
    await new AgregarContactoUseCase(repositorio, notificadorFalso(), enSegundos(0)).execute(1, datos('Caro'));

    const ochoDias = 8 * 24 * 3600;
    await expect(new ResponderInvitacionUseCase(repositorio, enSegundos(ochoDias)).ver('token-1')).rejects.toMatchObject({ codigo: 'INVITACION_INVALIDA' });
  });

  it('un rechazado no cuenta para el maximo ni ocupa color', async () => {
    const repositorio = repositorioEnMemoria();
    const agregar = new AgregarContactoUseCase(repositorio, notificadorFalso(), enSegundos(0));
    await agregar.execute(1, datos('Caro'));
    await agregar.execute(1, datos('Dani'));
    await agregar.execute(1, datos('Eva'));
    await new ResponderInvitacionUseCase(repositorio, enSegundos(10)).execute('token-1', 'rechazo');

    expect((await agregar.execute(1, datos('Fer'))).color).toBe(0);
  });

  it('reenviar: solo a pendientes, no antes de 60 segundos, y el enlace anterior deja de servir', async () => {
    const repositorio = repositorioEnMemoria();
    const notificador = notificadorFalso();
    const caro = await new AgregarContactoUseCase(repositorio, notificador, enSegundos(0)).execute(1, datos('Caro'));

    await expect(new ReenviarInvitacionUseCase(repositorio, notificador, enSegundos(30)).execute(1, caro.id)).rejects.toMatchObject({
      codigo: 'INVITACION_RECIEN_ENVIADA',
    });
    await new ReenviarInvitacionUseCase(repositorio, notificador, enSegundos(61)).execute(1, caro.id);

    expect(notificador.enviados.map((a) => a.token)).toEqual(['token-1', 'token-2']);
    await expect(new ResponderInvitacionUseCase(repositorio, enSegundos(70)).ver('token-1')).rejects.toMatchObject({ codigo: 'INVITACION_INVALIDA' });
    await new ResponderInvitacionUseCase(repositorio, enSegundos(70)).execute('token-2', 'acepto');
    await expect(new ReenviarInvitacionUseCase(repositorio, notificador, enSegundos(200)).execute(1, caro.id)).rejects.toMatchObject({
      codigo: 'INVITACION_NO_PENDIENTE',
    });
  });

  it('cambiar el correo deja el contacto pendiente y envia una invitacion nueva; cambiar el nombre no', async () => {
    const repositorio = repositorioEnMemoria();
    const notificador = notificadorFalso();
    const caro = await new AgregarContactoUseCase(repositorio, notificador, enSegundos(0)).execute(1, datos('Caro'));
    await new ResponderInvitacionUseCase(repositorio, enSegundos(5)).execute('token-1', 'acepto');
    const actualizar = new ActualizarContactoUseCase(repositorio, notificador, enSegundos(10));

    expect((await actualizar.execute(1, caro.id, { nombre: 'Carolina' })).estado).toBe('aceptado');
    expect(notificador.enviados).toHaveLength(1);
    expect((await actualizar.execute(1, caro.id, { correo: 'nuevo@correo.com' })).estado).toBe('pendiente');
    expect(notificador.enviados.map((a) => a.correo)).toEqual(['caro@correo.com', 'nuevo@correo.com']);
  });

  it('nadie puede cambiar, reenviar ni borrar contactos de otro ciudadano', async () => {
    const repositorio = repositorioEnMemoria();
    const notificador = notificadorFalso();
    const ajeno = await new AgregarContactoUseCase(repositorio, notificador).execute(2, datos('Caro'));

    await expect(new ActualizarContactoUseCase(repositorio, notificador).execute(1, ajeno.id, { nombre: 'X' })).rejects.toMatchObject({
      codigo: 'CONTACTO_NO_ENCONTRADO',
    });
    await expect(new ReenviarInvitacionUseCase(repositorio, notificador).execute(1, ajeno.id)).rejects.toMatchObject({ codigo: 'CONTACTO_NO_ENCONTRADO' });
    await expect(new EliminarContactoUseCase(repositorio).execute(1, ajeno.id)).rejects.toMatchObject({ codigo: 'CONTACTO_NO_ENCONTRADO' });
  });

  it('cambia el orden', async () => {
    const repositorio = repositorioEnMemoria();
    const agregar = new AgregarContactoUseCase(repositorio, notificadorFalso());
    const caro = await agregar.execute(1, datos('Caro'));
    const dani = await agregar.execute(1, datos('Dani'));

    const ordenados = await new OrdenarContactosUseCase(repositorio).execute(1, [dani.id, caro.id]);

    expect(ordenados.map((c) => c.nombre)).toEqual(['Dani', 'Caro']);
  });

  it('responde USUARIO_NO_ENCONTRADO si el ciudadano ya no existe', async () => {
    await expect(new AgregarContactoUseCase(repositorioEnMemoria(), notificadorFalso()).execute(9, datos('Caro'))).rejects.toMatchObject({
      codigo: 'USUARIO_NO_ENCONTRADO',
    });
  });
});
