import { DomainError } from '../../../../shared/domain-error';
import { AreaMapa } from './area-mapa';

// Pruebas del rectangulo del mapa que llega desde el dashboard o la app
describe('AreaMapa', () => {
  const bogota = { minLat: 4.6, minLon: -74.15, maxLat: 4.7, maxLon: -74.05 };

  it('guarda las cuatro esquinas cuando son validas', () => {
    expect(new AreaMapa(bogota)).toEqual(bogota);
  });

  it('lanza DomainError si la latitud minima es mayor que la maxima', () => {
    expect(() => new AreaMapa({ ...bogota, minLat: 4.8 })).toThrow(DomainError);
  });

  it('lanza DomainError si una longitud se sale del planeta', () => {
    expect(() => new AreaMapa({ ...bogota, minLon: -200 })).toThrow(DomainError);
  });
});
