import { CriterioRuta } from '../domain/catalogos';
import { Ruta } from '../domain/ruta';
import { PeticionRutas, ResultadoRutas } from './calcular-rutas.use-case';
import { RecalcularRutaUseCase } from './recalcular-ruta.use-case';

const rutaDe = (tipo: CriterioRuta, distanciaM: number): Ruta => ({
  tipo,
  distanciaM,
  duracionS: distanciaM / 4,
  porcentajeEnCiclovia: 50,
  coordenadas: [],
  pasos: [],
});

describe('RecalcularRutaUseCase', () => {
  const actual = { latitud: 4.65, longitud: -74.08 };
  const destino = { latitud: 4.67, longitud: -74.06 };

  // Calculo de rutas en memoria que recuerda desde donde se le pidio
  const calculoFalso = () => {
    const pedidas: PeticionRutas[] = [];
    return {
      pedidas,
      execute: async (peticion: PeticionRutas): Promise<ResultadoRutas> => {
        pedidas.push(peticion);
        return { rutas: [rutaDe('segura', 3000), rutaDe('equilibrada', 2800), rutaDe('rapida', 2500)], riesgoDisponible: true };
      },
    };
  };

  it('calcula desde donde esta el ciudadano y devuelve solo el tipo que habia elegido', async () => {
    const calculo = calculoFalso();

    const resultado = await new RecalcularRutaUseCase(calculo).execute({ actual, destino, tipo: 'rapida' });

    expect(calculo.pedidas).toEqual([{ origen: actual, destino }]);
    expect(resultado).toEqual({ ruta: rutaDe('rapida', 2500), riesgoDisponible: true });
  });

  it('mantiene la ruta segura si esa era la elegida', async () => {
    const resultado = await new RecalcularRutaUseCase(calculoFalso()).execute({ actual, destino, tipo: 'segura' });

    expect(resultado.ruta.tipo).toBe('segura');
  });
});
