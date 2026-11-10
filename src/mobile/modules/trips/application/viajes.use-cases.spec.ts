import { PuntoViaje, Viaje, ViajeConPuntos } from '../domain/viaje';
import { FinalizarViajeUseCase } from './finalizar-viaje.use-case';
import { IniciarViajeUseCase } from './iniciar-viaje.use-case';
import { ListarViajesUseCase } from './listar-viajes.use-case';
import { ObtenerViajeUseCase } from './obtener-viaje.use-case';
import { RegistrarPuntoUseCase } from './registrar-punto.use-case';
import { ViajesRepositoryPort } from './viajes.repository.port';

const FECHA = '2026-10-22T18:00:00.000Z';

// Repositorio falso que guarda en memoria
function crearRepositorio(): ViajesRepositoryPort {
  const viajes: ViajeConPuntos[] = [];
  const sinPuntos = (v: ViajeConPuntos): Viaje => ({
    id: v.id,
    usuarioId: v.usuarioId,
    estado: v.estado,
    distanciaM: v.distanciaM,
    iniciadoEn: v.iniciadoEn,
    finalizadoEn: v.finalizadoEn,
  });
  return {
    buscarEnCurso: async (usuarioId) => {
      const viaje = viajes.find((v) => v.usuarioId === usuarioId && v.estado === 'en_curso');
      return viaje === undefined ? null : sinPuntos(viaje);
    },
    iniciar: async (nuevo) => {
      const viaje: ViajeConPuntos = {
        id: viajes.length + 1,
        usuarioId: nuevo.usuarioId,
        estado: 'en_curso',
        distanciaM: 0,
        iniciadoEn: FECHA,
        finalizadoEn: null,
        puntos: [{ latitud: nuevo.latitud, longitud: nuevo.longitud, registradoEn: FECHA }],
      };
      viajes.push(viaje);
      return sinPuntos(viaje);
    },
    buscarPorId: async (id) => viajes.find((v) => v.id === id) ?? null,
    agregarPunto: async (viajeId, ubicacion) => {
      const punto: PuntoViaje = { ...ubicacion, registradoEn: FECHA };
      (viajes.find((v) => v.id === viajeId) as ViajeConPuntos).puntos.push(punto);
      return punto;
    },
    finalizar: async (id, distanciaM) => {
      const viaje = viajes.find((v) => v.id === id) as ViajeConPuntos;
      viaje.estado = 'finalizado';
      viaje.distanciaM = distanciaM;
      viaje.finalizadoEn = FECHA;
      return sinPuntos(viaje);
    },
    listar: async (usuarioId) => viajes.filter((v) => v.usuarioId === usuarioId).map(sinPuntos),
  };
}

const salida = { latitud: 4.65, longitud: -74.08 };

describe('IniciarViajeUseCase', () => {
  it('inicia el viaje en curso con distancia cero', async () => {
    const viaje = await new IniciarViajeUseCase(crearRepositorio()).execute({ usuarioId: 1, ...salida });

    expect(viaje).toMatchObject({ id: 1, usuarioId: 1, estado: 'en_curso', distanciaM: 0, finalizadoEn: null });
  });

  it('rechaza una ubicacion fuera de rango', async () => {
    await expect(new IniciarViajeUseCase(crearRepositorio()).execute({ usuarioId: 1, latitud: 95, longitud: -74.08 })).rejects.toMatchObject({
      codigo: 'VIAJE_INVALIDO',
    });
  });

  it('no deja tener dos viajes en curso a la vez', async () => {
    const repositorio = crearRepositorio();
    await new IniciarViajeUseCase(repositorio).execute({ usuarioId: 1, ...salida });

    await expect(new IniciarViajeUseCase(repositorio).execute({ usuarioId: 1, ...salida })).rejects.toMatchObject({
      codigo: 'VIAJE_EN_CURSO_DUPLICADO',
    });
  });

  it('otro ciudadano si puede iniciar el suyo', async () => {
    const repositorio = crearRepositorio();
    await new IniciarViajeUseCase(repositorio).execute({ usuarioId: 1, ...salida });

    const viaje = await new IniciarViajeUseCase(repositorio).execute({ usuarioId: 2, ...salida });

    expect(viaje.id).toBe(2);
  });
});

describe('RegistrarPuntoUseCase', () => {
  it('agrega un punto al viaje en curso', async () => {
    const repositorio = crearRepositorio();
    await new IniciarViajeUseCase(repositorio).execute({ usuarioId: 1, ...salida });

    const punto = await new RegistrarPuntoUseCase(repositorio).execute(1, 1, { latitud: 4.651, longitud: -74.081 });

    expect(punto).toMatchObject({ latitud: 4.651, longitud: -74.081 });
  });

  it('rechaza un punto invalido y un viaje que ya termino', async () => {
    const repositorio = crearRepositorio();
    await new IniciarViajeUseCase(repositorio).execute({ usuarioId: 1, ...salida });
    await expect(new RegistrarPuntoUseCase(repositorio).execute(1, 1, { latitud: 4.65, longitud: 200 })).rejects.toMatchObject({
      codigo: 'VIAJE_INVALIDO',
    });

    await new FinalizarViajeUseCase(repositorio).execute(1, 1);

    await expect(new RegistrarPuntoUseCase(repositorio).execute(1, 1, salida)).rejects.toMatchObject({ codigo: 'VIAJE_INVALIDO' });
  });

  it('el viaje de otro ciudadano responde como si no existiera', async () => {
    const repositorio = crearRepositorio();
    await new IniciarViajeUseCase(repositorio).execute({ usuarioId: 1, ...salida });

    await expect(new RegistrarPuntoUseCase(repositorio).execute(2, 1, salida)).rejects.toMatchObject({ codigo: 'VIAJE_NO_ENCONTRADO' });
  });
});

describe('FinalizarViajeUseCase', () => {
  it('cierra el viaje y calcula los metros recorridos con todos los puntos', async () => {
    const repositorio = crearRepositorio();
    await new IniciarViajeUseCase(repositorio).execute({ usuarioId: 1, latitud: 4, longitud: -74 });
    await new RegistrarPuntoUseCase(repositorio).execute(1, 1, { latitud: 5, longitud: -74 });

    const viaje = await new FinalizarViajeUseCase(repositorio).execute(1, 1);

    expect(viaje.estado).toBe('finalizado');
    expect(viaje.distanciaM).toBeGreaterThan(111_000);
    expect(viaje.distanciaM).toBeLessThan(111_400);
  });

  it('no deja finalizar dos veces ni un viaje ajeno ni uno que no existe', async () => {
    const repositorio = crearRepositorio();
    await new IniciarViajeUseCase(repositorio).execute({ usuarioId: 1, ...salida });
    await new FinalizarViajeUseCase(repositorio).execute(1, 1);

    await expect(new FinalizarViajeUseCase(repositorio).execute(1, 1)).rejects.toMatchObject({ codigo: 'VIAJE_INVALIDO' });
    await expect(new FinalizarViajeUseCase(repositorio).execute(2, 1)).rejects.toMatchObject({ codigo: 'VIAJE_NO_ENCONTRADO' });
    await expect(new FinalizarViajeUseCase(repositorio).execute(1, 9)).rejects.toMatchObject({ codigo: 'VIAJE_NO_ENCONTRADO' });
  });
});

describe('ListarViajesUseCase y ObtenerViajeUseCase', () => {
  it('cada ciudadano ve solo sus viajes', async () => {
    const repositorio = crearRepositorio();
    await new IniciarViajeUseCase(repositorio).execute({ usuarioId: 1, ...salida });
    await new IniciarViajeUseCase(repositorio).execute({ usuarioId: 2, ...salida });

    const viajes = await new ListarViajesUseCase(repositorio).execute(1);

    expect(viajes.map((v) => v.id)).toEqual([1]);
  });

  it('el detalle trae el recorrido y el viaje ajeno no se puede ver', async () => {
    const repositorio = crearRepositorio();
    await new IniciarViajeUseCase(repositorio).execute({ usuarioId: 1, ...salida });

    const detalle = await new ObtenerViajeUseCase(repositorio).execute(1, 1);

    expect(detalle.puntos).toHaveLength(1);
    await expect(new ObtenerViajeUseCase(repositorio).execute(2, 1)).rejects.toMatchObject({ codigo: 'VIAJE_NO_ENCONTRADO' });
  });
});
