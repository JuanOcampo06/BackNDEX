import { PuntoViaje, Viaje, ViajeConPuntos } from '../domain/viaje';
import { FinalizarViajeUseCase } from './finalizar-viaje.use-case';
import { IniciarViajeUseCase } from './iniciar-viaje.use-case';
import { ListarViajesUseCase } from './listar-viajes.use-case';
import { ObtenerViajeUseCase } from './obtener-viaje.use-case';
import { RegistrarPuntoUseCase } from './registrar-punto.use-case';
import { ViajesRepositoryPort } from './viajes.repository.port';

const FECHA = '2026-10-22T18:00:00.000Z';

// Repositorio falso que guarda en memoria
// los reportes son las fechas ISO en que cada ciudadano envio uno
function crearRepositorio(reportes: { usuarioId: number; creadoEn: string }[] = []): ViajesRepositoryPort {
  const viajes: ViajeConPuntos[] = [];
  const sinPuntos = (v: ViajeConPuntos): Viaje => ({
    id: v.id,
    usuarioId: v.usuarioId,
    tipoVehiculo: v.tipoVehiculo,
    estado: v.estado,
    distanciaM: v.distanciaM,
    duracionS: v.duracionS,
    cantidadReportes: v.cantidadReportes,
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
        tipoVehiculo: nuevo.tipoVehiculo,
        estado: 'en_curso',
        distanciaM: 0,
        duracionS: null,
        cantidadReportes: 0,
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
    finalizar: async (id, resultado) => {
      const viaje = viajes.find((v) => v.id === id) as ViajeConPuntos;
      viaje.estado = 'finalizado';
      viaje.distanciaM = resultado.distanciaM;
      viaje.duracionS = resultado.duracionS;
      viaje.cantidadReportes = resultado.cantidadReportes;
      viaje.finalizadoEn = resultado.finalizadoEn;
      return sinPuntos(viaje);
    },
    contarReportes: async (usuarioId, desde, hasta) =>
      reportes.filter((r) => r.usuarioId === usuarioId && r.creadoEn >= desde && r.creadoEn <= hasta).length,
    listar: async (usuarioId) => viajes.filter((v) => v.usuarioId === usuarioId).map(sinPuntos),
  };
}

const salida = { latitud: 4.65, longitud: -74.08, tipoVehiculo: 'bicicleta' };

describe('IniciarViajeUseCase', () => {
  it('inicia el viaje en curso con distancia cero', async () => {
    const viaje = await new IniciarViajeUseCase(crearRepositorio()).execute({ usuarioId: 1, ...salida });

    expect(viaje).toMatchObject({ id: 1, usuarioId: 1, estado: 'en_curso', distanciaM: 0, finalizadoEn: null });
  });

  it('rechaza una ubicacion fuera de rango', async () => {
    await expect(new IniciarViajeUseCase(crearRepositorio()).execute({ usuarioId: 1, latitud: 95, longitud: -74.08, tipoVehiculo: 'bicicleta' })).rejects.toMatchObject({
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
    await new IniciarViajeUseCase(repositorio).execute({ usuarioId: 1, latitud: 4, longitud: -74, tipoVehiculo: 'bicicleta' });
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

describe('vehiculo, duracion y reportes del viaje', () => {
  const HORA_FIN = new Date('2026-10-22T18:10:00.000Z');

  it('guarda el vehiculo con el que sale el ciudadano', async () => {
    const viaje = await new IniciarViajeUseCase(crearRepositorio()).execute({ usuarioId: 1, ...salida, tipoVehiculo: 'patineta_electrica' });

    expect(viaje.tipoVehiculo).toBe('patineta_electrica');
    expect(viaje).toMatchObject({ duracionS: null, cantidadReportes: 0 });
  });

  it('rechaza un vehiculo que no existe', async () => {
    await expect(new IniciarViajeUseCase(crearRepositorio()).execute({ usuarioId: 1, ...salida, tipoVehiculo: 'moto' })).rejects.toMatchObject({
      codigo: 'VIAJE_INVALIDO',
    });
  });

  it('al finalizar guarda cuantos segundos duro el viaje', async () => {
    const repositorio = crearRepositorio();
    await new IniciarViajeUseCase(repositorio).execute({ usuarioId: 1, ...salida });

    const viaje = await new FinalizarViajeUseCase(repositorio, () => HORA_FIN).execute(1, 1);

    // El viaje empezo a las 18:00 y termino a las 18:10
    expect(viaje.duracionS).toBe(600);
    expect(viaje.finalizadoEn).toBe('2026-10-22T18:10:00.000Z');
  });

  it('la duracion nunca es negativa aunque el reloj de la api vaya atrasado', async () => {
    const repositorio = crearRepositorio();
    await new IniciarViajeUseCase(repositorio).execute({ usuarioId: 1, ...salida });

    const viaje = await new FinalizarViajeUseCase(repositorio, () => new Date('2026-10-22T17:59:59.000Z')).execute(1, 1);

    expect(viaje.duracionS).toBe(0);
  });

  it('cuenta solo los reportes que el ciudadano envio durante el viaje', async () => {
    const repositorio = crearRepositorio([
      { usuarioId: 1, creadoEn: '2026-10-22T17:59:00.000Z' },
      { usuarioId: 1, creadoEn: '2026-10-22T18:00:00.000Z' },
      { usuarioId: 1, creadoEn: '2026-10-22T18:05:00.000Z' },
      { usuarioId: 1, creadoEn: '2026-10-22T18:10:00.000Z' },
      { usuarioId: 1, creadoEn: '2026-10-22T18:20:00.000Z' },
      { usuarioId: 2, creadoEn: '2026-10-22T18:05:00.000Z' },
    ]);
    await new IniciarViajeUseCase(repositorio).execute({ usuarioId: 1, ...salida });

    const viaje = await new FinalizarViajeUseCase(repositorio, () => HORA_FIN).execute(1, 1);

    // Cuentan los de las 18:00, 18:05 y 18:10 de ella y no el de antes, el de despues ni el de otro ciudadano
    expect(viaje.cantidadReportes).toBe(3);
  });

  it('un viaje sin reportes termina con cero', async () => {
    const repositorio = crearRepositorio();
    await new IniciarViajeUseCase(repositorio).execute({ usuarioId: 1, ...salida });

    const viaje = await new FinalizarViajeUseCase(repositorio, () => HORA_FIN).execute(1, 1);

    expect(viaje.cantidadReportes).toBe(0);
  });
});
