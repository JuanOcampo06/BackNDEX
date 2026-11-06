import { incluyeFuente } from './filtros-tablero';
import { Periodo } from './periodo';

describe('incluyeFuente', () => {
  const periodo = Periodo.desdeFiltro(new Date(2025, 11, 15));

  it('sin fuente elegida se incluyen las dos fuentes', () => {
    expect(incluyeFuente({ periodo }, 'anuario')).toBe(true);
    expect(incluyeFuente({ periodo }, 'app')).toBe(true);
  });

  it('con una sola fuente se excluye la otra', () => {
    expect(incluyeFuente({ periodo, fuente: ['anuario'] }, 'anuario')).toBe(true);
    expect(incluyeFuente({ periodo, fuente: ['anuario'] }, 'app')).toBe(false);
  });

  it('con las dos fuentes se combinan', () => {
    expect(incluyeFuente({ periodo, fuente: ['anuario', 'app'] }, 'app')).toBe(true);
  });
});
