import { Periodo } from '../domain/periodo';
import { ObtenerTarjetaUseCase } from './obtener-tarjeta.use-case';
import { ObtenerTendenciaMensualUseCase } from './obtener-tendencia-mensual.use-case';
import { ObtenerTopAlertasUseCase } from './obtener-top-alertas.use-case';
import { ObtenerUsuariosPorTipoUseCase } from './obtener-usuarios-por-tipo.use-case';
import { ConteoPorSubcategoria, TableroRepositoryPort } from './tablero.repository.port';

const filtros = { periodo: Periodo.desdeFiltro(new Date(2025, 11, 15), '2025-10', '2025-12') };

// Repositorio falso que solo responde lo que necesita cada prueba
function tablero(parcial: Partial<TableroRepositoryPort>): TableroRepositoryPort {
  return parcial as TableroRepositoryPort;
}

describe('ObtenerTopAlertasUseCase', () => {
  const conteos: ConteoPorSubcategoria[] = [
    { subcategoria: 'robo', categoria: 'seguridad', total: 41 },
    { subcategoria: 'hueco', categoria: 'danos_en_la_via', total: 62 },
    { subcategoria: 'obra', categoria: 'danos_en_la_via', total: 10 },
    { subcategoria: 'accidente', categoria: 'transito', total: 48 },
    { subcategoria: 'poca_luz', categoria: 'seguridad', total: 27 },
    { subcategoria: 'semaforo_danado', categoria: 'transito', total: 27 },
  ];

  it('devuelve las cinco mas reportadas de mayor a menor con su porcentaje sobre todas las alertas', async () => {
    const resultado = await new ObtenerTopAlertasUseCase(tablero({ contarReportesPorSubcategoria: async () => conteos })).execute(filtros);

    expect(resultado.totalAlertas).toBe(215);
    expect(resultado.top).toEqual([
      { subcategoria: 'hueco', categoria: 'danos_en_la_via', total: 62, porcentaje: 28.8 },
      { subcategoria: 'accidente', categoria: 'transito', total: 48, porcentaje: 22.3 },
      { subcategoria: 'robo', categoria: 'seguridad', total: 41, porcentaje: 19.1 },
      { subcategoria: 'poca_luz', categoria: 'seguridad', total: 27, porcentaje: 12.6 },
      { subcategoria: 'semaforo_danado', categoria: 'transito', total: 27, porcentaje: 12.6 },
    ]);
  });

  it('sin alertas responde total cero y top vacio', async () => {
    const resultado = await new ObtenerTopAlertasUseCase(tablero({ contarReportesPorSubcategoria: async () => [] })).execute(filtros);

    expect(resultado).toEqual({ totalAlertas: 0, top: [] });
  });
});

describe('Usuarios de micromovilidad', () => {
  it('la tarjeta usa el mismo total que usuarios por tipo y no suma semana a semana', async () => {
    const repositorio = tablero({
      // El mismo ciudadano aparece dos semanas y por eso la suma de la serie seria 5
      contarPorSemana: async () => [
        { semana: '2025-10-06', total: 3 },
        { semana: '2025-10-13', total: 2 },
      ],
      contarUsuariosPorTipo: async () => [
        { tipoVehiculo: 'bicicleta', total: 3 },
        { tipoVehiculo: 'patineta', total: 1 },
      ],
    });

    const tarjeta = await new ObtenerTarjetaUseCase(repositorio).execute('usuarios', filtros);
    const porTipo = await new ObtenerUsuariosPorTipoUseCase(repositorio).execute(filtros);

    expect(tarjeta.valor).toBe(4);
    expect(porTipo.total).toBe(tarjeta.valor);
  });
});

describe('Serie de la tendencia mensual', () => {
  it('trae un total por cada mes del rango aunque abarque varios anios y en cero los meses sin datos', async () => {
    const repositorio = tablero({ contarSiniestrosPorMes: async () => [{ mes: '2025-12', total: 956 }] });
    const largo = { periodo: Periodo.desdeFiltro(new Date(2026, 1, 1), '2025-11', '2026-02') };

    const tendencia = await new ObtenerTendenciaMensualUseCase(repositorio).execute(largo);

    expect(tendencia.serie).toEqual([
      { mes: '2025-11', total: 0 },
      { mes: '2025-12', total: 956 },
      { mes: '2026-01', total: 0 },
      { mes: '2026-02', total: 0 },
    ]);
  });
});
