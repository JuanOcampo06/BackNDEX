// Categorias que el ciudadano puede elegir al reportar y son las mismas que muestra el dashboard
export const CATEGORIAS_REPORTE = [
  'via_en_mal_estado',
  'poca_iluminacion',
  'obstaculo_en_cicloruta',
  'conductor_imprudente',
  'hurto_o_inseguridad',
] as const;
export type CategoriaReporte = (typeof CATEGORIAS_REPORTE)[number];

// Estados por los que pasa un reporte despues de enviarlo
export const ESTADOS_REPORTE = ['recibido', 'en_revision', 'resuelto', 'descartado'] as const;
export type EstadoReporte = (typeof ESTADOS_REPORTE)[number];
