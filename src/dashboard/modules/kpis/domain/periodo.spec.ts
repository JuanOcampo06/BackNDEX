import { DomainError } from '../../../../shared/domain-error';
import { Periodo } from './periodo';

// Pruebas del rango de meses que usan todos los filtros del tablero
describe('Periodo', () => {
  const hoy = new Date(2026, 9, 20);

  it('sin meses toma los ultimos tres meses hasta el mes de hoy', () => {
    const periodo = Periodo.desdeFiltro(hoy);

    expect(periodo.meses()).toEqual(['2026-08', '2026-09', '2026-10']);
    expect(periodo.fechaInicio()).toBe('2026-08-01');
    expect(periodo.fechaFinExclusiva()).toBe('2026-11-01');
  });

  it('el periodo anterior tiene la misma cantidad de meses y cruza el cambio de anio', () => {
    const periodo = Periodo.desdeFiltro(hoy, '2026-01', '2026-02');

    expect(periodo.anterior().meses()).toEqual(['2025-11', '2025-12']);
  });

  it('los anios de comparacion van de enero del anio anterior a diciembre del anio final', () => {
    const comparacion = Periodo.desdeFiltro(hoy, '2026-08', '2026-10').aniosDeComparacion();

    expect(comparacion.fechaInicio()).toBe('2025-01-01');
    expect(comparacion.fechaFinExclusiva()).toBe('2027-01-01');
  });

  it('lanza DomainError si el mes inicial es posterior al final', () => {
    expect(() => Periodo.desdeFiltro(hoy, '2026-10', '2026-08')).toThrow(DomainError);
  });
});
