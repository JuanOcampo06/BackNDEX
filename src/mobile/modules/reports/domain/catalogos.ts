// Categorias principales que el ciudadano elige primero al reportar
// el dashboard solo muestra estas y suma en cada una todas sus subcategorias
export const CATEGORIAS_REPORTE = ['danos_en_la_via', 'transito', 'seguridad', 'otro'] as const;
export type CategoriaReporte = (typeof CATEGORIAS_REPORTE)[number];

// Subcategorias que la app muestra despues de elegir la categoria principal
// otro no trae opciones en la app y por eso su unica subcategoria es otro
export const SUBCATEGORIAS_POR_CATEGORIA = {
  danos_en_la_via: ['hueco', 'obra', 'via_cerrada'],
  transito: ['accidente', 'semaforo_danado'],
  seguridad: ['robo', 'poca_luz', 'policia'],
  otro: ['otro'],
} as const satisfies Record<CategoriaReporte, readonly string[]>;
export type SubcategoriaReporte = (typeof SUBCATEGORIAS_POR_CATEGORIA)[CategoriaReporte][number];

// Todas las subcategorias juntas para validar y documentar
export const SUBCATEGORIAS_REPORTE: readonly SubcategoriaReporte[] = CATEGORIAS_REPORTE.flatMap(
  (categoria) => SUBCATEGORIAS_POR_CATEGORIA[categoria],
);

// Estados por los que pasa un reporte despues de enviarlo
export const ESTADOS_REPORTE = ['recibido', 'en_revision', 'resuelto', 'descartado'] as const;
export type EstadoReporte = (typeof ESTADOS_REPORTE)[number];
