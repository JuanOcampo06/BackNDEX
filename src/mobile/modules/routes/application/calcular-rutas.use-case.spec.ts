import { Ruta } from '../domain/ruta';
import { ViaCiclista } from '../domain/via-ciclista';
import { CalcularRutasUseCase } from './calcular-rutas.use-case';
import { RedCicloviasRepositoryPort } from './red-ciclovias.repository.port';
import { Punto, RutasPorCallesPort } from './rutas-por-calles.port';
import { SiniestrosRepositoryPort } from './siniestros.repository.port';

// Sin servicio de mapas: las rutas salen solo de la red de ciclovias
const sinCalles: RutasPorCallesPort = { alternativasPorCalles: async () => [], rutaPorPuntos: async () => null };

// Sin siniestros en el anuario: la segura solo distingue la ciclovia de la calle
const sinSiniestros: SiniestrosRepositoryPort = { obtenerSiniestros: async () => [] };

// Triangulo de ciclovias: ir de A a B por la via directa mide unos 1.100 metros y por C mide unos 1.570
const A: [number, number] = [4.6, -74.1];
const B: [number, number] = [4.6, -74.09];
const C: [number, number] = [4.605, -74.095];
const D: [number, number] = [4.62, -74.1];
const E: [number, number] = [4.62, -74.09];

function via(id: number, nodos: [number, number][], riesgo: string | null = null, tipo: ViaCiclista['tipo'] = 'ciclovia'): ViaCiclista {
  const idDePunto = (punto: [number, number]) => [A, B, C, D, E].findIndex((p) => p === punto) + 1;
  return { id, tipo, riesgo, nodos: nodos.map(idDePunto), coordenadas: nodos };
}

function repositorio(vias: ViaCiclista[]): RedCicloviasRepositoryPort {
  return { obtenerVias: async () => vias };
}

// Salen a unos 11 metros de A y llegan a unos 11 metros de B y los dos estan sobre la misma linea de la ciclovia
const origen = { latitud: 4.6, longitud: -74.1001 };
const destino = { latitud: 4.6, longitud: -74.0899 };

const porTipo = (rutas: Ruta[], tipo: string): Ruta => rutas.find((ruta) => ruta.tipo === tipo) as Ruta;

describe('CalcularRutasUseCase', () => {
  it('devuelve la ruta segura, la equilibrada y la rapida en ese orden', async () => {
    const casoDeUso = new CalcularRutasUseCase(repositorio([via(1, [A, B])]), sinCalles, sinSiniestros);

    const { rutas } = await casoDeUso.execute({ origen, destino });

    expect(rutas.map((ruta) => ruta.tipo)).toEqual(['segura', 'equilibrada', 'rapida']);
  });

  it('cada ruta trae distancia, tiempo, coordenadas desde el origen hasta el destino y pasos', async () => {
    const { rutas } = await new CalcularRutasUseCase(repositorio([via(1, [A, B])]), sinCalles, sinSiniestros).execute({ origen, destino });
    const rapida = porTipo(rutas, 'rapida');

    expect(rapida.distanciaM).toBeGreaterThan(1100);
    expect(rapida.distanciaM).toBeLessThan(1200);
    // A unos 15 km/h en ciclovia y algo menos en el trayecto por calle de los extremos
    expect(rapida.duracionS).toBeGreaterThan(240);
    expect(rapida.duracionS).toBeLessThan(330);
    expect(rapida.coordenadas[0]).toEqual([origen.latitud, origen.longitud]);
    expect(rapida.coordenadas[rapida.coordenadas.length - 1]).toEqual([destino.latitud, destino.longitud]);
    expect(rapida.pasos.map((paso) => paso.tipo)).toEqual(['salida', 'llegada']);
    // Casi todo el recorrido va por ciclovia y solo los extremos van por calle
    expect(rapida.porcentajeEnCiclovia).toBeGreaterThan(90);
    expect(rapida.porcentajeEnCiclovia).toBeLessThan(100);
  });

  it('sin datos de riesgo las tres rutas coinciden y riesgoDisponible es false', async () => {
    const vias = [via(1, [A, B]), via(2, [A, C]), via(3, [C, B])];

    const resultado = await new CalcularRutasUseCase(repositorio(vias), sinCalles, sinSiniestros).execute({ origen, destino });

    expect(resultado.riesgoDisponible).toBe(false);
    expect(resultado.rutas[0].coordenadas).toEqual(resultado.rutas[1].coordenadas);
    expect(resultado.rutas[1].coordenadas).toEqual(resultado.rutas[2].coordenadas);
  });

  it('con datos de riesgo la rapida sigue por el camino corto y la segura esquiva el tramo de riesgo alto', async () => {
    const vias = [via(1, [A, B], 'alto'), via(2, [A, C], 'bajo'), via(3, [C, B], 'bajo')];

    const resultado = await new CalcularRutasUseCase(repositorio(vias), sinCalles, sinSiniestros).execute({ origen, destino });
    const rapida = porTipo(resultado.rutas, 'rapida');
    const segura = porTipo(resultado.rutas, 'segura');

    expect(resultado.riesgoDisponible).toBe(true);
    expect(rapida.distanciaM).toBeLessThan(1200);
    expect(segura.distanciaM).toBeGreaterThan(1500);
    expect(segura.coordenadas).toContainEqual(C);
    expect(rapida.coordenadas).not.toContainEqual(C);
    // La rapida nunca tarda mas que la segura
    expect(rapida.duracionS).toBeLessThanOrEqual(segura.duracionS);
  });

  it('la equilibrada rodea el tramo de riesgo alto pero no el de riesgo medio, que la segura si rodea', async () => {
    const conRiesgo = (riesgo: string) => [via(1, [A, B], riesgo), via(2, [A, C], 'bajo'), via(3, [C, B], 'bajo')];

    const medio = (await new CalcularRutasUseCase(repositorio(conRiesgo('medio')), sinCalles, sinSiniestros).execute({ origen, destino })).rutas;
    const alto = (await new CalcularRutasUseCase(repositorio(conRiesgo('alto')), sinCalles, sinSiniestros).execute({ origen, destino })).rutas;
    const rodea = (rutas: Ruta[], tipo: string) => porTipo(rutas, tipo).coordenadas.some(([lat, lon]) => lat === C[0] && lon === C[1]);

    // Con riesgo medio solo la segura da la vuelta
    expect([rodea(medio, 'segura'), rodea(medio, 'equilibrada'), rodea(medio, 'rapida')]).toEqual([true, false, false]);
    // Con riesgo alto la equilibrada tambien da la vuelta y la rapida sigue por el camino corto
    expect([rodea(alto, 'segura'), rodea(alto, 'equilibrada'), rodea(alto, 'rapida')]).toEqual([true, true, false]);
  });

  it('rechaza un origen o un destino con coordenadas invalidas', async () => {
    const casoDeUso = new CalcularRutasUseCase(repositorio([via(1, [A, B])]), sinCalles, sinSiniestros);

    await expect(casoDeUso.execute({ origen: { latitud: 95, longitud: -74.1 }, destino })).rejects.toMatchObject({ codigo: 'RUTA_INVALIDA' });
    await expect(casoDeUso.execute({ origen, destino: { latitud: 4.6, longitud: 200 } })).rejects.toMatchObject({ codigo: 'RUTA_INVALIDA' });
  });

  it('rechaza un origen y un destino que son casi el mismo lugar', async () => {
    const casoDeUso = new CalcularRutasUseCase(repositorio([via(1, [A, B])]), sinCalles, sinSiniestros);

    await expect(casoDeUso.execute({ origen, destino: { latitud: 4.60012, longitud: -74.1001 } })).rejects.toMatchObject({
      codigo: 'RUTA_INVALIDA',
    });
  });

  it('avisa cuando el origen o el destino estan lejos de toda ciclovia', async () => {
    const casoDeUso = new CalcularRutasUseCase(repositorio([via(1, [A, B])]), sinCalles, sinSiniestros);

    await expect(casoDeUso.execute({ origen: { latitud: 4.7, longitud: -74.1 }, destino })).rejects.toMatchObject({
      codigo: 'RUTA_FUERA_DE_COBERTURA',
      message: expect.stringContaining('origen'),
    });
    await expect(casoDeUso.execute({ origen, destino: { latitud: 4.7, longitud: -74.1 } })).rejects.toMatchObject({
      codigo: 'RUTA_FUERA_DE_COBERTURA',
      message: expect.stringContaining('destino'),
    });
  });

  it('avisa cuando hay ciclovia cerca pero sin conexion entre el origen y el destino', async () => {
    // La segunda ciclovia queda a dos kilometros de la primera
    const casoDeUso = new CalcularRutasUseCase(repositorio([via(1, [A, B]), via(2, [D, E])]), sinCalles, sinSiniestros);

    await expect(casoDeUso.execute({ origen, destino: { latitud: 4.6201, longitud: -74.0899 } })).rejects.toMatchObject({
      codigo: 'RUTA_SIN_CAMINO',
    });
  });

  it('usa los datos nuevos cuando el repositorio entrega otra lista', async () => {
    let vias = [via(1, [A, B], 'alto'), via(2, [A, C], 'bajo'), via(3, [C, B], 'bajo')];
    const casoDeUso = new CalcularRutasUseCase({ obtenerVias: async () => vias }, sinCalles, sinSiniestros);
    const antes = await casoDeUso.execute({ origen, destino });

    vias = [via(1, [A, B], 'bajo'), via(2, [A, C], 'bajo'), via(3, [C, B], 'bajo')];
    const despues = await casoDeUso.execute({ origen, destino });

    expect(porTipo(antes.rutas, 'segura').coordenadas).toContainEqual(C);
    expect(porTipo(despues.rutas, 'segura').coordenadas).not.toContainEqual(C);
  });
});

describe('CalcularRutasUseCase con calles', () => {
  const punto = ([latitud, longitud]: [number, number]): Punto => ({ latitud, longitud });
  // Ciclovia en forma de triangulo A, C, B: de A a B por ahi mide unos 1.570 metros y en linea recta unos 1.100
  const triangulo = (riesgo: string | null = null): ViaCiclista[] => [via(1, [A, C], riesgo), via(2, [C, B], riesgo)];
  // Camino directo por la calle: casi recto, unos 1.120 metros y casi nada pegado a la ciclovia
  const directo: Punto[] = [origen, destino];
  // Camino que sigue la ciclovia: unos 1.590 metros y casi todo pegado a ella
  const porCiclovia: Punto[] = [origen, A, C, B, destino].map((p) => (Array.isArray(p) ? punto(p as [number, number]) : (p as Punto)));
  const calles = (...caminos: Punto[][]): RutasPorCallesPort & { llamadas: number } => {
    const puerto = {
      llamadas: 0,
      alternativasPorCalles: async () => {
        puerto.llamadas++;
        return caminos;
      },
      // Sin desvios: aqui solo se prueban las alternativas
      rutaPorPuntos: async () => null,
    };
    return puerto;
  };
  const porTipoDe = (rutas: Ruta[]) => ({ segura: porTipo(rutas, 'segura'), equilibrada: porTipo(rutas, 'equilibrada'), rapida: porTipo(rutas, 'rapida') });

  it('la rapida toma el camino mas corto y la segura el que mas aprovecha la ciclovia', async () => {
    // Ciclovia en triangulo mas bajo, por el punto 4.603,-74.095: rodear por ella mide unos 1.300 metros, un 15% mas que ir derecho
    const bajo: [number, number] = [4.603, -74.095];
    const ciclovia: ViaCiclista[] = [
      { id: 1, tipo: 'ciclovia', riesgo: null, nodos: [1, 9], coordenadas: [A, bajo] },
      { id: 2, tipo: 'ciclovia', riesgo: null, nodos: [9, 2], coordenadas: [bajo, B] },
    ];
    const porLaCiclovia: Punto[] = [origen, punto(A), punto(bajo), punto(B), destino];
    const casoDeUso = new CalcularRutasUseCase(repositorio(ciclovia), calles(directo, porLaCiclovia), sinSiniestros);

    const { segura, rapida } = porTipoDe((await casoDeUso.execute({ origen, destino })).rutas);

    expect(rapida.distanciaM).toBeLessThan(1200);
    expect(rapida.porcentajeEnCiclovia).toBeLessThan(15);
    expect(segura.distanciaM).toBeGreaterThan(1250);
    expect(segura.porcentajeEnCiclovia).toBeGreaterThan(90);
  });

  it('descarta las alternativas que alargan el viaje mas del 30%', async () => {
    // Rodear por el triangulo alto mide un 42% mas que ir derecho
    const casoDeUso = new CalcularRutasUseCase(repositorio(triangulo()), calles(directo, porCiclovia), sinSiniestros);

    const { rutas } = await casoDeUso.execute({ origen, destino });

    expect(rutas.every((ruta) => ruta.distanciaM < 1200)).toBe(true);
  });

  it('el porcentaje por ciclovia se mide sobre el camino y no es 0 cuando la calle va junto a una ciclovia', async () => {
    const pegado: Punto[] = [origen, A, B, destino].map((p) => (Array.isArray(p) ? punto(p as [number, number]) : (p as Punto)));
    const casoDeUso = new CalcularRutasUseCase(repositorio([via(1, [A, B])]), calles(pegado), sinSiniestros);

    const { rutas } = await casoDeUso.execute({ origen, destino });

    expect(rutas.every((ruta) => ruta.porcentajeEnCiclovia > 90)).toBe(true);
  });

  it('con muchos siniestros junto a la ciclovia la segura prefiere la calle aunque sea un poco mas larga', async () => {
    const porLaCalle: Punto[] = [origen, { latitud: 4.6015, longitud: -74.095 }, destino];
    // Un siniestro con bicicleta cada 100 metros a lo largo de la ciclovia
    const siniestros: SiniestrosRepositoryPort = {
      obtenerSiniestros: async () =>
        Array.from({ length: 11 }, (_, i) => ({ latitud: 4.6, longitud: -74.1 + i * 0.001, conBicicleta: true, conMuertos: false })),
    };
    const casoDeUso = new CalcularRutasUseCase(repositorio([via(1, [A, B])]), calles([origen, destino], porLaCalle), siniestros);

    const { segura, rapida } = porTipoDe((await casoDeUso.execute({ origen, destino })).rutas);

    // La calle diagonal roza la ciclovia en los dos extremos pero casi todo el camino va lejos de ella
    expect(segura.porcentajeEnCiclovia).toBeLessThan(25);
    expect(rapida.porcentajeEnCiclovia).toBeGreaterThan(90);
  });

  it('pide las alternativas a las calles una sola vez por busqueda', async () => {
    const puerto = calles(directo, porCiclovia);

    await new CalcularRutasUseCase(repositorio(triangulo()), puerto, sinSiniestros).execute({ origen, destino });

    expect(puerto.llamadas).toBe(1);
  });

  it('cada ruta trae distancia, tiempo, coordenadas de punta a punta y pasos', async () => {
    const { rutas } = await new CalcularRutasUseCase(repositorio(triangulo()), calles(directo), sinSiniestros).execute({ origen, destino });

    for (const ruta of rutas) {
      expect(ruta.distanciaM).toBeGreaterThan(1100);
      expect(ruta.duracionS).toBeGreaterThan(200);
      expect(ruta.coordenadas[0]).toEqual([origen.latitud, origen.longitud]);
      expect(ruta.coordenadas[ruta.coordenadas.length - 1]).toEqual([destino.latitud, destino.longitud]);
      expect(ruta.pasos.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('va por las calles aunque no haya ciclovia cerca ni conexion, sin dar error', async () => {
    const lejos = { latitud: 4.7, longitud: -74.1 };
    const camino: Punto[] = [lejos, { latitud: 4.7, longitud: -74.09 }];
    const casoDeUso = new CalcularRutasUseCase(repositorio([via(1, [A, B])]), calles(camino), sinSiniestros);

    const { rutas } = await casoDeUso.execute({ origen: lejos, destino: { latitud: 4.7, longitud: -74.09 } });

    expect(rutas.map((ruta) => ruta.tipo)).toEqual(['segura', 'equilibrada', 'rapida']);
    expect(rutas.every((ruta) => ruta.porcentajeEnCiclovia === 0)).toBe(true);
  });

  it('si las calles no responden deja la ruta de la red de ciclovias', async () => {
    const casoDeUso = new CalcularRutasUseCase(repositorio(triangulo()), calles(), sinSiniestros);

    const { rutas } = await casoDeUso.execute({ origen, destino });

    expect(rutas[0].porcentajeEnCiclovia).toBeGreaterThan(90);
  });
});

describe('CalcularRutasUseCase con desvios por ciclovia', () => {
  const punto = ([latitud, longitud]: [number, number]): Punto => ({ latitud, longitud });
  // Camino directo largo de unos 4,4 km hacia el este y una ciclovia paralela de bajo riesgo 280 metros al norte
  const origenLargo = { latitud: 4.6, longitud: -74.1 };
  const destinoLargo = { latitud: 4.6, longitud: -74.06 };
  const directo: Punto[] = [origenLargo, destinoLargo];
  const ciclovia = (riesgo: string | null): ViaCiclista => ({
    id: 1,
    tipo: 'ciclovia',
    riesgo,
    nodos: [1, 2],
    coordenadas: [
      [4.6025, -74.1],
      [4.6025, -74.06],
    ],
  });
  // Camino que sube a la ciclovia, la sigue y baja: unos 4,9 km y casi todo pegado a ella
  const porLaCiclovia: Punto[] = [origenLargo, punto([4.6025, -74.1]), punto([4.6025, -74.06]), destinoLargo];

  function calles(desvio: Punto[] | null): RutasPorCallesPort & { pedidos: Punto[][] } {
    const puerto = {
      pedidos: [] as Punto[][],
      alternativasPorCalles: async () => [directo],
      rutaPorPuntos: async (_o: Punto, _d: Punto, intermedios: Punto[]) => {
        puerto.pedidos.push(intermedios);
        return desvio;
      },
    };
    return puerto;
  }
  const rutasDe = async (puerto: RutasPorCallesPort, riesgo: string | null = 'bajo') =>
    (await new CalcularRutasUseCase(repositorio([ciclovia(riesgo)]), puerto, sinSiniestros).execute({ origen: origenLargo, destino: destinoLargo })).rutas;

  it('pide a las calles un camino que pase por una ciclovia cercana al camino directo', async () => {
    const puerto = calles(porLaCiclovia);

    await rutasDe(puerto);

    expect(puerto.pedidos.length).toBeGreaterThan(0);
    // Todos los puntos pedidos quedan sobre la ciclovia
    for (const punto of puerto.pedidos.flat()) {
      expect(punto.latitud).toBeCloseTo(4.6025, 4);
    }
  });

  it('la segura toma el desvio por la ciclovia y la rapida sigue por el camino directo', async () => {
    const rutas = await rutasDe(calles(porLaCiclovia));
    const segura = porTipo(rutas, 'segura');
    const rapida = porTipo(rutas, 'rapida');

    expect(segura.porcentajeEnCiclovia).toBeGreaterThan(60);
    expect(rapida.porcentajeEnCiclovia).toBeLessThan(15);
    expect(segura.distanciaM).toBeGreaterThan(rapida.distanciaM);
  });

  it('descarta un desvio que alarga el viaje mas del 30%', async () => {
    // Sube a la ciclovia, la recorre hasta mas alla del destino y vuelve: casi el doble de largo
    const muyLargo: Punto[] = [origenLargo, punto([4.6025, -74.1]), punto([4.6025, -74.02]), punto([4.6025, -74.06]), destinoLargo];

    const rutas = await rutasDe(calles(muyLargo));

    expect(rutas.every((ruta) => ruta.distanciaM < 5000)).toBe(true);
    expect(rutas.every((ruta) => ruta.porcentajeEnCiclovia < 15)).toBe(true);
  });

  it('no pide desvios si la ciclovia mas cercana es de riesgo alto', async () => {
    const puerto = calles(porLaCiclovia);

    await rutasDe(puerto, 'alto');

    expect(puerto.pedidos).toHaveLength(0);
  });

  it('si no se pudo trazar el desvio queda el camino directo', async () => {
    const rutas = await rutasDe(calles(null));

    expect(rutas.map((ruta) => ruta.tipo)).toEqual(['segura', 'equilibrada', 'rapida']);
    expect(rutas.every((ruta) => ruta.porcentajeEnCiclovia < 15)).toBe(true);
  });
});
