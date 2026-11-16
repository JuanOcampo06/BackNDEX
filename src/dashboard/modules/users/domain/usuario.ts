import { Rol, ROLES } from './catalogos';
import { UsuarioInvalidoError } from './usuario-invalido.error';

const MAXIMO_NOMBRE = 120;
const MAXIMO_ENTIDAD = 120;
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Largo permitido de la contrasena y 72 es lo maximo que aceptan muchos cifradores
export const MINIMO_CONTRASENA = 8;
export const MAXIMO_CONTRASENA = 72;

// Usuario ya guardado y el id y las fechas los pone la base de datos
// la contrasena nunca sale del modulo
export interface Usuario {
  id: number;
  nombreCompleto: string;
  correo: string;
  rol: Rol;
  entidad: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

// Lo que se necesita para crear un usuario y la contrasena llega sin cifrar
// sin contrasena el usuario existe pero no puede iniciar sesion
export interface NuevoUsuario {
  nombreCompleto: string;
  correo: string;
  rol: Rol;
  entidad: string | null;
  contrasena?: string;
}

// Campos que se pueden cambiar y todos son opcionales
export type CambiosUsuario = Partial<NuevoUsuario>;

// Lo que recibe la base de datos con la contrasena ya cifrada
export type UsuarioParaGuardar = Omit<NuevoUsuario, 'contrasena'> & { contrasenaCifrada?: string };
export type CambiosParaGuardar = Omit<CambiosUsuario, 'contrasena'> & { contrasenaCifrada?: string };

// Datos tal como llegan desde afuera todavia sin revisar
export interface DatosUsuario {
  nombreCompleto?: string;
  correo?: string;
  rol?: string;
  entidad?: string | null;
  contrasena?: string;
}

// Aplica las reglas a un usuario nuevo y el nombre el correo y el rol son obligatorios
export function crearNuevoUsuario(datos: DatosUsuario): NuevoUsuario {
  if (datos.nombreCompleto === undefined || datos.correo === undefined || datos.rol === undefined) {
    throw new UsuarioInvalidoError('El nombre el correo y el rol son obligatorios');
  }
  const nuevo: NuevoUsuario = {
    nombreCompleto: validarNombre(datos.nombreCompleto),
    correo: validarCorreo(datos.correo),
    rol: validarRol(datos.rol),
    entidad: validarEntidad(datos.entidad ?? null),
  };
  if (datos.contrasena !== undefined) nuevo.contrasena = validarContrasena(datos.contrasena);
  return nuevo;
}

// Aplica las reglas solo a los campos que llegan y exige al menos uno
export function crearCambiosUsuario(datos: DatosUsuario): CambiosUsuario {
  const cambios: CambiosUsuario = {};
  if (datos.nombreCompleto !== undefined) cambios.nombreCompleto = validarNombre(datos.nombreCompleto);
  if (datos.correo !== undefined) cambios.correo = validarCorreo(datos.correo);
  if (datos.rol !== undefined) cambios.rol = validarRol(datos.rol);
  if (datos.entidad !== undefined) cambios.entidad = validarEntidad(datos.entidad);
  if (datos.contrasena !== undefined) cambios.contrasena = validarContrasena(datos.contrasena);
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

// La entidad es opcional y un texto vacio la borra
function validarEntidad(entidad: string | null): string | null {
  const limpia = entidad?.trim() ?? '';
  if (limpia.length > MAXIMO_ENTIDAD) {
    throw new UsuarioInvalidoError(`La entidad no puede pasar de ${MAXIMO_ENTIDAD} caracteres`);
  }
  return limpia === '' ? null : limpia;
}

export function validarContrasena(contrasena: string): string {
  if (contrasena.length < MINIMO_CONTRASENA || contrasena.length > MAXIMO_CONTRASENA) {
    throw new UsuarioInvalidoError(`La contrasena debe tener entre ${MINIMO_CONTRASENA} y ${MAXIMO_CONTRASENA} caracteres`);
  }
  return contrasena;
}
