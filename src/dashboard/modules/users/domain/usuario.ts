import { Rol, ROLES } from './catalogos';
import { UsuarioInvalidoError } from './usuario-invalido.error';

const MAXIMO_NOMBRE = 120;
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Usuario ya guardado y el id y las fechas los pone la base de datos
export interface Usuario {
  id: number;
  nombreCompleto: string;
  correo: string;
  rol: Rol;
  creadoEn: string;
  actualizadoEn: string;
}

// Lo que se necesita para crear un usuario
export type NuevoUsuario = Pick<Usuario, 'nombreCompleto' | 'correo' | 'rol'>;

// Campos que se pueden cambiar y todos son opcionales
export type CambiosUsuario = Partial<NuevoUsuario>;

// Datos tal como llegan desde afuera todavia sin revisar
export interface DatosUsuario {
  nombreCompleto?: string;
  correo?: string;
  rol?: string;
}

// Aplica las reglas a un usuario nuevo y todos los campos son obligatorios
export function crearNuevoUsuario(datos: DatosUsuario): NuevoUsuario {
  if (datos.nombreCompleto === undefined || datos.correo === undefined || datos.rol === undefined) {
    throw new UsuarioInvalidoError('El nombre el correo y el rol son obligatorios');
  }
  return {
    nombreCompleto: validarNombre(datos.nombreCompleto),
    correo: validarCorreo(datos.correo),
    rol: validarRol(datos.rol),
  };
}

// Aplica las reglas solo a los campos que llegan y exige al menos uno
export function crearCambiosUsuario(datos: DatosUsuario): CambiosUsuario {
  const cambios: CambiosUsuario = {};
  if (datos.nombreCompleto !== undefined) cambios.nombreCompleto = validarNombre(datos.nombreCompleto);
  if (datos.correo !== undefined) cambios.correo = validarCorreo(datos.correo);
  if (datos.rol !== undefined) cambios.rol = validarRol(datos.rol);
  if (Object.keys(cambios).length === 0) {
    throw new UsuarioInvalidoError('No llego ningun campo para actualizar');
  }
  return cambios;
}

function validarNombre(nombre: string): string {
  const limpio = nombre.trim();
  if (limpio.length === 0 || limpio.length > MAXIMO_NOMBRE) {
    throw new UsuarioInvalidoError(`El nombre debe tener entre 1 y ${MAXIMO_NOMBRE} caracteres`);
  }
  return limpio;
}

// El correo se guarda en minusculas para que no se repita con otra forma de escribirlo
function validarCorreo(correo: string): string {
  const limpio = correo.trim().toLowerCase();
  if (!FORMATO_CORREO.test(limpio)) {
    throw new UsuarioInvalidoError(`El correo ${correo} no es valido`);
  }
  return limpio;
}

function validarRol(rol: string): Rol {
  if (!(ROLES as readonly string[]).includes(rol)) {
    throw new UsuarioInvalidoError(`El rol ${rol} no existe y debe ser ${ROLES.join(' o ')}`);
  }
  return rol as Rol;
}
