import { decodificarPolilinea, GoogleRutasPorCallesAdapter, trazadosDe } from './google-rutas-por-calles.adapter';

const origen = { latitud: 4.6, longitud: -74.1 };
const destino = { latitud: 4.61, longitud: -74.09 };
// Ejemplo de la documentacion de Google
const POLILINEA = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';

describe('decodificarPolilinea', () => {
  it('lee los puntos del formato de Google', () => {
    expect(decodificarPolilinea(POLILINEA)).toEqual([
      { latitud: 38.5, longitud: -120.2 },
      { latitud: 40.7, longitud: -120.95 },
      { latitud: 43.252, longitud: -126.453 },
    ]);
  });
});

describe('trazadosDe', () => {
  it('devuelve los puntos de cada camino de la respuesta', () => {
    const trazados = trazadosDe({ routes: [{ polyline: { encodedPolyline: POLILINEA } }, { polyline: { encodedPolyline: POLILINEA } }] });

    expect(trazados).toHaveLength(2);
    expect(trazados[0]).toHaveLength(3);
  });

  it('descarta los caminos vacios y devuelve lista vacia si Google no manda ninguno', () => {
    expect(trazadosDe({})).toEqual([]);
    expect(trazadosDe({ routes: [{}, { polyline: { encodedPolyline: '' } }] })).toEqual([]);
  });
});

describe('GoogleRutasPorCallesAdapter', () => {
  afterEach(() => jest.restoreAllMocks());

  it('sin llave no llama a Google', async () => {
    const llamada = jest.spyOn(global, 'fetch');

    expect(await new GoogleRutasPorCallesAdapter('').alternativasPorCalles(origen, destino)).toEqual([]);
    expect(llamada).not.toHaveBeenCalled();
  });

  it('pide a pie y con alternativas en una sola llamada y devuelve todos los caminos', async () => {
    const respuesta = new Response(JSON.stringify({ routes: [{ polyline: { encodedPolyline: POLILINEA } }, { polyline: { encodedPolyline: POLILINEA } }] }), { status: 200 });
    const llamada = jest.spyOn(global, 'fetch').mockResolvedValueOnce(respuesta);

    const trazados = await new GoogleRutasPorCallesAdapter('llave').alternativasPorCalles(origen, destino);

    expect(trazados).toHaveLength(2);
    expect(llamada).toHaveBeenCalledTimes(1);
    const cuerpo = JSON.parse(String(llamada.mock.calls[0][1]?.body));
    expect(cuerpo).toMatchObject({ travelMode: 'WALK', computeAlternativeRoutes: true });
    expect(cuerpo.intermediates).toBeUndefined();
  });

  it('rutaPorPuntos pide los puntos intermedios, sin alternativas, y devuelve un solo camino', async () => {
    const respuesta = new Response(JSON.stringify({ routes: [{ polyline: { encodedPolyline: POLILINEA } }] }), { status: 200 });
    const llamada = jest.spyOn(global, 'fetch').mockResolvedValueOnce(respuesta);

    const camino = await new GoogleRutasPorCallesAdapter('llave').rutaPorPuntos(origen, destino, [{ latitud: 4.605, longitud: -74.095 }]);

    expect(camino).toHaveLength(3);
    const cuerpo = JSON.parse(String(llamada.mock.calls[0][1]?.body));
    expect(cuerpo.intermediates).toHaveLength(1);
    expect(cuerpo.computeAlternativeRoutes).toBeUndefined();
  });

  it('rutaPorPuntos devuelve null si Google no manda camino', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

    expect(await new GoogleRutasPorCallesAdapter('llave').rutaPorPuntos(origen, destino, [])).toBeNull();
  });

  it('devuelve lista vacia y no lanza error si Google responde con error o falla', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(new Response('prohibido', { status: 403 })).mockRejectedValueOnce(new Error('sin red'));
    const adaptador = new GoogleRutasPorCallesAdapter('llave');

    expect(await adaptador.alternativasPorCalles(origen, destino)).toEqual([]);
    expect(await adaptador.alternativasPorCalles(origen, destino)).toEqual([]);
  });
});
