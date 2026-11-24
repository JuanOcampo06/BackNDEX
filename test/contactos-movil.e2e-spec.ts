import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { CONTACTOS_REPOSITORY, NOTIFICADOR_INVITACIONES } from '../src/mobile/modules/contactos';
import type { AvisoInvitacion, ContactoEmergencia, ContactosRepositoryPort, Invitacion } from '../src/mobile/modules/contactos';
import { firmarToken } from '../src/platform/auth';

interface Fila {
  usuarioId: number;
  orden: number;
  contacto: ContactoEmergencia;
  token: string | null;
  venceEn: Date | null;
}

// Repositorio en memoria para probar sin base de datos; el ciudadano 1 se llama Ana <b>Lopez</b> para probar que el HTML se escapa
function repositorioEnMemoria(): ContactosRepositoryPort {
  const filas: Fila[] = [];
  let siguienteId = 1;
  let siguienteToken = 1;
  const delUsuario = (usuarioId: number) => filas.filter((f) => f.usuarioId === usuarioId).sort((a, b) => a.orden - b.orden);
  const fila = (usuarioId: number, id: number) => filas.find((f) => f.usuarioId === usuarioId && f.contacto.id === id);
  return {
    listar: async (usuarioId) => delUsuario(usuarioId).map((f) => ({ ...f.contacto })),
    crear: async (usuarioId, nuevo) => {
      const contacto = { ...nuevo, id: siguienteId++ };
      filas.push({ usuarioId, orden: delUsuario(usuarioId).length, contacto, token: null, venceEn: null });
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
    nombreDelCiudadano: async () => 'Ana <b>Lopez</b>',
    nuevaInvitacion: async (contactoId, fechas) => {
      const token = `token-${siguienteToken++}`;
      const f = filas.find((x) => x.contacto.id === contactoId);
      if (f) Object.assign(f, { token, venceEn: fechas.venceEn });
      return token;
    },
    invitacionEnviadaEn: async () => null,
    buscarInvitacion: async (token): Promise<Invitacion | null> => {
      const f = filas.find((x) => x.token === token);
      return f && f.venceEn ? { contactoId: f.contacto.id, ciudadano: 'Ana <b>Lopez</b>', contacto: f.contacto.nombre, estado: f.contacto.estado, venceEn: f.venceEn } : null;
    },
    responderInvitacion: async (contactoId, estado) => {
      const f = filas.find((x) => x.contacto.id === contactoId);
      if (f) Object.assign(f, { token: null, contacto: { ...f.contacto, estado } });
    },
  };
}

describe('Contactos de emergencia de la app movil (e2e)', () => {
  const ruta = '/api/mobile/v1/me/contactos';
  const enviados: AvisoInvitacion[] = [];
  let app: INestApplication;
  let autorizacion: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'secreto-de-pruebas-con-mas-de-32-caracteres';
    autorizacion = `Bearer ${firmarToken(1)}`;
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CONTACTOS_REPOSITORY)
      .useValue(repositorioEnMemoria())
      .overrideProvider(NOTIFICADOR_INVITACIONES)
      .useValue({ enviarInvitacion: async (aviso: AvisoInvitacion) => void enviados.push(aviso) })
      .compile();
    app = modulo.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const nuevo = (nombre: string) => ({ nombre, parentesco: 'Amigo', telefono: '300 123 4567', correo: `${nombre}@correo.com` });

  it('responde 401 sin token', async () => {
    expect((await http().get(ruta)).status).toBe(401);
  });

  it('agrega un contacto, le llega la invitacion y al aceptar desde la pagina la app lo ve aceptado', async () => {
    const caro = await http().post(ruta).set('Authorization', autorizacion).send(nuevo('caro'));
    expect(caro.status).toBe(201);
    expect(caro.body).toMatchObject({ nombre: 'caro', telefono: '3001234567', estado: 'pendiente', color: 0 });
    const token = enviados[enviados.length - 1].token;

    const pagina = await http().get(`/api/mobile/v1/invitaciones/${token}?respuesta=acepto`);
    expect(pagina.status).toBe(200);
    expect(pagina.headers['content-type']).toContain('text/html');
    expect(pagina.text).toContain('Ana &lt;b&gt;Lopez&lt;/b&gt;');
    expect(pagina.text).toContain('¿Confirmas que aceptas?');

    const respuesta = await http().post(`/api/mobile/v1/invitaciones/${token}`).type('form').send({ respuesta: 'acepto' });
    expect(respuesta.status).toBe(200);
    expect(respuesta.text).toContain('Ahora eres contacto de emergencia');

    const lista = await http().get(ruta).set('Authorization', autorizacion);
    expect(lista.body.contactos[0].estado).toBe('aceptado');

    const otraVez = await http().get(`/api/mobile/v1/invitaciones/${token}`);
    expect(otraVez.text).toContain('ya no es válida');
  });

  it('rechazar deja el contacto rechazado para que la app avise', async () => {
    const dani = await http().post(ruta).set('Authorization', autorizacion).send(nuevo('dani'));
    const token = enviados[enviados.length - 1].token;

    await http().post(`/api/mobile/v1/invitaciones/${token}`).type('form').send({ respuesta: 'rechazo' });

    const lista = await http().get(ruta).set('Authorization', autorizacion);
    expect(lista.body.contactos.find((c: { id: number }) => c.id === dani.body.id).estado).toBe('rechazado');
  });

  it('reenviar responde 202 a un pendiente y 400 a uno que ya contesto', async () => {
    const eva = await http().post(ruta).set('Authorization', autorizacion).send(nuevo('eva'));
    const pendiente = await http().post(`${ruta}/${eva.body.id}/reenviar`).set('Authorization', autorizacion);
    const contestado = await http().post(`${ruta}/1/reenviar`).set('Authorization', autorizacion);

    expect(pendiente.status).toBe(202);
    expect([contestado.status, contestado.body.codigo]).toEqual([400, 'INVITACION_NO_PENDIENTE']);
  });

  it('ya no se puede cambiar el estado desde la app y los datos malos responden 400', async () => {
    const conEstado = await http().patch(`${ruta}/1`).set('Authorization', autorizacion).send({ estado: 'aceptado' });
    const malo = await http().post(ruta).set('Authorization', autorizacion).send({ ...nuevo('fer'), telefono: '601 123 4567' });
    const noExiste = await http().delete(`${ruta}/999`).set('Authorization', autorizacion);

    expect(conEstado.status).toBe(400);
    expect([malo.status, malo.body.codigo]).toEqual([400, 'CONTACTO_INVALIDO']);
    expect([noExiste.status, noExiste.body.codigo]).toEqual([404, 'CONTACTO_NO_ENCONTRADO']);
  });
});
