import { DomainError } from '../../../../shared/domain-error';
import { AreaMapa } from './area-mapa';

describe('AreaMapa de semaforos', () => {
  const bogota = { minLat: 4.6, minLon: -74.15, maxLat: 4.7, maxLon: -74.05 };

  it('guarda las cuatro esquinas cuando son validas', () => {
    expect(new AreaMapa(bogota)).toEqual(bogota);
  });

  it('lanza AREA_INVALIDA si el minimo pasa al maximo o algo se sale del planeta', () => {
    expect(() => new AreaMapa({ ...bogota, minLat: 4.8 })).toThrow(DomainError);
    expect(() => new AreaMapa({ ...bogota, minLon: -200 })).toThrow(DomainError);
    expect(() => new AreaMapa({ ...bogota, maxLat: Number.NaN })).toThrow(DomainError);
  });
});
