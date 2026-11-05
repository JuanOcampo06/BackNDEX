import { DomainError } from '../../../../shared/domain-error';

// KPIs que el usuario puede elegir al exportar y salen en este orden dentro del Excel
// cada nombre es el mismo del endpoint del tablero pero con guion bajo
export const KPIS_EXPORTABLES = [
  'tarjeta_siniestros',
  'tarjeta_usuarios',
  'tarjeta_reportes',
  'tarjeta_boton_panico',
  'tarjeta_falsos_positivos',
  'mapa_siniestros',
  'lugares_con_mas_siniestros',
  'siniestros_por_hora',
  'tendencia_mensual',
  'siniestros_por_sexo_y_edad',
  'usuarios_por_tipo',
  'boton_panico',
  'reportes',
  'falsos_positivos',
] as const;
export type KpiExportable = (typeof KPIS_EXPORTABLES)[number];

// Revisa la seleccion del usuario y la devuelve sin repetidos y en el orden del catalogo
export function normalizarKpis(seleccion: readonly string[]): KpiExportable[] {
  const desconocido = seleccion.find((kpi) => !(KPIS_EXPORTABLES as readonly string[]).includes(kpi));
  if (desconocido !== undefined) {
    throw new DomainError('KPI_INVALIDO', `El KPI ${desconocido} no existe y debe ser uno de ${KPIS_EXPORTABLES.join(', ')}`);
  }
  const elegidos = KPIS_EXPORTABLES.filter((kpi) => seleccion.includes(kpi));
  if (elegidos.length === 0) {
    throw new DomainError('KPIS_VACIOS', 'Hay que elegir al menos un KPI para exportar');
  }
  return elegidos;
}
