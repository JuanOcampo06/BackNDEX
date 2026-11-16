import { coordenadasValidas } from '../../../../shared/coordenadas';
import { esTipoVehiculo, TipoVehiculo } from '../../../../shared/tipos-vehiculo';
import {
  CATEGORIAS_REPORTE,
  CategoriaReporte,
  EstadoReporte,
  SUBCATEGORIAS_POR_CATEGORIA,
  SubcategoriaReporte,
} from './catalogos';
import { ReporteInvalidoError } from './reporte-invalido.error';

const MAXIMO_DESCRIPCION = 500;

// Reporte ya guardado: el id, el estado y la fecha los pone la base de datos
export interface Reporte {
  id: number;
  usuarioId: number;
  categoria: CategoriaReporte;
  subcategoria: SubcategoriaReporte;
  tipoVehiculo: TipoVehiculo;
  descripcion: string | null;
  latitud: number;
  longitud: number;
  estado: EstadoReporte;
  creadoEn: string;
}

// Lo que se necesita para crear un reporte nuevo
export type NuevoReporte = Pick<Reporte, 'usuarioId' | 'categoria' | 'subcategoria' | 'tipoVehiculo' | 'descripcion' | 'latitud' | 'longitud'>;

// Datos tal como llegan desde afuera todavia sin revisar
export interface DatosReporte {
  usuarioId: number;
  categoria: string;
  subcategoria: string;
  tipoVehiculo: string;
  descripcion?: string | null;
  latitud: number;
  longitud: number;
}

function esCategoria(valor: string): valor is CategoriaReporte {
  return (CATEGORIAS_REPORTE as readonly string[]).includes(valor);
}

// La subcategoria tiene que ser una de las que la app muestra para esa categoria
function esSubcategoriaDe(categoria: CategoriaReporte, valor: string): valor is SubcategoriaReporte {
  return (SUBCATEGORIAS_POR_CATEGORIA[categoria] as readonly string[]).includes(valor);
}

// Aplica las reglas del negocio y devuelve un reporte listo para guardar
export function crearNuevoReporte(datos: DatosReporte): NuevoReporte {
  if (!esCategoria(datos.categoria)) {
    throw new ReporteInvalidoError(`La categoria ${datos.categoria} no existe`);
  }
  if (!esSubcategoriaDe(datos.categoria, datos.subcategoria)) {
    throw new ReporteInvalidoError(`La subcategoria ${datos.subcategoria} no pertenece a la categoria ${datos.categoria}`);
  }
  if (!esTipoVehiculo(datos.tipoVehiculo)) {
    throw new ReporteInvalidoError(`El tipo de vehiculo ${datos.tipoVehiculo} no existe`);
  }
  if (!coordenadasValidas(datos.latitud, datos.longitud)) {
    throw new ReporteInvalidoError('La ubicacion del reporte no es valida');
  }
  const descripcion = datos.descripcion?.trim() || null;
  if (descripcion !== null && descripcion.length > MAXIMO_DESCRIPCION) {
    throw new ReporteInvalidoError(`La descripcion no puede pasar de ${MAXIMO_DESCRIPCION} caracteres`);
  }
  return {
    usuarioId: datos.usuarioId,
    categoria: datos.categoria,
    subcategoria: datos.subcategoria,
    tipoVehiculo: datos.tipoVehiculo,
    descripcion,
    latitud: datos.latitud,
    longitud: datos.longitud,
  };
}
