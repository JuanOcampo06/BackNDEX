import { DomainError } from '../../../../shared/domain-error';
import { KPIS_EXPORTABLES, normalizarKpis } from './kpis-exportables';

// Pruebas de la seleccion de KPIs que llega desde la ventana de exportar
describe('normalizarKpis', () => {
  it('quita repetidos y deja los KPIs en el orden del catalogo', () => {
    expect(normalizarKpis(['reportes', 'tarjeta_siniestros', 'reportes'])).toEqual(['tarjeta_siniestros', 'reportes']);
  });

  it('acepta todos los KPIs del catalogo', () => {
    expect(normalizarKpis([...KPIS_EXPORTABLES])).toEqual([...KPIS_EXPORTABLES]);
  });

  it('lanza KPI_INVALIDO si alguno no existe', () => {
    expect(() => normalizarKpis(['reportes', 'otro'])).toThrow(DomainError);
    expect(() => normalizarKpis(['otro'])).toThrow(expect.objectContaining({ codigo: 'KPI_INVALIDO' }));
  });

  it('lanza KPIS_VACIOS si no se eligio ninguno', () => {
    expect(() => normalizarKpis([])).toThrow(expect.objectContaining({ codigo: 'KPIS_VACIOS' }));
  });
});
