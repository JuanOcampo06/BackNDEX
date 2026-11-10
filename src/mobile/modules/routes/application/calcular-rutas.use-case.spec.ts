import { Ruta } from '../domain/ruta';
import { ViaCiclista } from '../domain/via-ciclista';
import { CalcularRutasUseCase } from './calcular-rutas.use-case';
import { RedCicloviasRepositoryPort } from './red-ciclovias.repository.port';

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
    const casoDeUso = new CalcularRutasUseCase(repositorio([via(1, [A, B])]));

    const { rutas } = await casoDeUso.execute({ origen, destino });

    expect(rutas.map((ruta) => ruta.tipo)).toEqual(['segura', 'equilibrada', 'rapida']);
  });

  it('cada ruta trae distancia, tiempo, coordenadas desde el origen hasta el destino y pasos', async () => {
    const { rutas } = await new CalcularRutasUseCase(repositorio([via(1, [A, B])])).execute({ origen, destino });
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

    const resultado = await new CalcularRutasUseCase(repositorio(vias)).execute({ origen, destino });

    expect(resultado.riesgoDisponible).toBe(false);
    expect(resultado.rutas[0].coordenadas).toEqual(resultado.rutas[1].coordenadas);
    expect(resultado.rutas[1].coordenadas).toEqual(resultado.rutas[2].coordenadas);
  });

  it('con datos de riesgo la rapida sigue por el camino corto y la segura esquiva el tramo de riesgo alto', async () => {
    const vias = [via(1, [A, B], 'alto'), via(2, [A, C], 'bajo'), via(3, [C, B], 'bajo')];

    const resultado = await new CalcularRutasUseCase(repositorio(vias)).execute({ origen, destino });
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

    const medio = (await new CalcularRutasUseCase(repositorio(conRiesgo('medio'))).execute({ origen, destino })).rutas;
    const alto = (await new CalcularRutasUseCase(repositorio(conRiesgo('alto'))).execute({ origen, destino })).rutas;
    const rodea = (rutas: Ruta[], tipo: string) => porTipo(rutas, tipo).coordenadas.some(([lat, lon]) => lat === C[0] && lon === C[1]);

    // Con riesgo medio solo la segura da la vuelta
    expect([rodea(medio, 'segura'), rodea(medio, 'equilibrada'), rodea(medio, 'rapida')]).toEqual([true, false, false]);
    // Con riesgo alto la equilibrada tambien da la vuelta y la rapida sigue por el camino corto
    expect([rodea(alto, 'segura'), rodea(alto, 'equilibrada'), rodea(alto, 'rapida')]).toEqual([true, true, false]);
  });

  it('rechaza un origen o un destino con coordenadas invalidas', async () => {
    const casoDeUso = new CalcularRutasUseCase(repositorio([via(1, [A, B])]));

    await expect(casoDeUso.execute({ origen: { latitud: 95, longitud: -74.1 }, destino })).rejects.toMatchObject({ codigo: 'RUTA_INVALIDA' });
    await expect(casoDeUso.execute({ origen, destino: { latitud: 4.6, longitud: 200 } })).rejects.toMatchObject({ codigo: 'RUTA_INVALIDA' });
  });

  it('rechaza un origen y un destino que son casi el mismo lugar', async () => {
    const casoDeUso = new CalcularRutasUseCase(repositorio([via(1, [A, B])]));

    await expect(casoDeUso.execute({ origen, destino: { latitud: 4.60012, longitud: -74.1001 } })).rejects.toMatchObject({
      codigo: 'RUTA_INVALIDA',
    });
  });

  it('avisa cuando el origen o el destino estan lejos de toda ciclovia', async () => {
    const casoDeUso = new CalcularRutasUseCase(repositorio([via(1, [A, B])]));

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
    const casoDeUso = new CalcularRutasUseCase(repositorio([via(1, [A, B]), via(2, [D, E])]));

    await expect(casoDeUso.execute({ origen, destino: { latitud: 4.6201, longitud: -74.0899 } })).rejects.toMatchObject({
      codigo: 'RUTA_SIN_CAMINO',
    });
  });

  it('usa los datos nuevos cuando el repositorio entrega otra lista', async () => {
    let vias = [via(1, [A, B], 'alto'), via(2, [A, C], 'bajo'), via(3, [C, B], 'bajo')];
    const casoDeUso = new CalcularRutasUseCase({ obtenerVias: async () => vias });
    const antes = await casoDeUso.execute({ origen, destino });

    vias = [via(1, [A, B], 'bajo'), via(2, [A, C], 'bajo'), via(3, [C, B], 'bajo')];
    const despues = await casoDeUso.execute({ origen, destino });

    expect(porTipo(antes.rutas, 'segura').coordenadas).toContainEqual(C);
    expect(porTipo(despues.rutas, 'segura').coordenadas).not.toContainEqual(C);
  });
});
