import { Genero, GENEROS } from './catalogos';
import { CiudadanoInvalidoError } from './ciudadano-invalido.error';

const MAXIMO_NOMBRE = 120;
const MINIMO_CONTRASENA = 8;
const MAXIMO_CONTRASENA = 72;
// La app es solo para mayores de edad
const EDAD_MINIMA = 18;
const PRIMER_ANIO_VALIDO = 1900;
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FORMATO_TELEFONO = /^\+?\d{7,15}$/;
const FORMATO_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

// Ciudadano ya guardado y el id lo pone la base de datos
// fechaNacimiento va como texto AAAA-MM-DD
export interface Ciudadano {
  id: number;
  nombreCompleto: string;
  correo: string;
  telefono: string | null;
  fechaNacimiento: string;
  genero: Genero;
}

// Lo que se necesita para registrar un ciudadano (la contrasena va aparte porque se guarda cifrada)
export type NuevoCiudadano = Omit<Ciudadano, 'id'>;

// Datos tal como llegan desde afuera todavia sin revisar
export interface DatosRegistro {
  nombreCompleto?: string;
  correo?: string;
  telefono?: string;
  contrasena?: string;
  fechaNacimiento?: string;
  genero?: string;
}

// Aplica las reglas del negocio y devuelve el ciudadano listo para guardar junto a su contrasena
// la fecha de hoy llega por parametro para que la regla de la mayoria de edad se pueda probar
export function crearNuevoCiudadano(datos: DatosRegistro, hoy: Date): { ciudadano: NuevoCiudadano; contrasena: string } {
  if (
    datos.nombreCompleto === undefined ||
    datos.correo === undefined ||
    datos.contrasena === undefined ||
    datos.fechaNacimiento === undefined ||
    datos.genero === undefined
  ) {
    throw new CiudadanoInvalidoError('El nombre, el correo, la contrasena, la fecha de nacimiento y el genero son obligatorios');
  }
  return {
    ciudadano: {
      nombreCompleto: validarNombre(datos.nombreCompleto),
      correo: validarCorreo(datos.correo),
      telefono: datos.telefono === undefined ? null : validarTelefono(datos.telefono),
      fechaNacimiento: validarFechaNacimiento(datos.fechaNacimiento, hoy),
      genero: validarGenero(datos.genero),
    },
    contrasena: validarContrasena(datos.contrasena),
  };
}

function validarNombre(nombre: string): string {
  const limpio = nombre.trim();
  if (limpio.length === 0 || limpio.length > MAXIMO_NOMBRE) {
    throw new CiudadanoInvalidoError(`El nombre debe tener entre 1 y ${MAXIMO_NOMBRE} caracteres`);
  }
  return limpio;
}

// El correo se guarda en minusculas para que no se repita con otra forma de escribirlo
export function validarCorreo(correo: string): string {
  const limpio = correo.trim().toLowerCase();
  if (!FORMATO_CORREO.test(limpio)) {
    throw new CiudadanoInvalidoError(`El correo ${correo} no es valido`);
  }
  return limpio;
}

function validarTelefono(telefono: string): string {
  const limpio = telefono.trim();
  if (!FORMATO_TELEFONO.test(limpio)) {
    throw new CiudadanoInvalidoError('El telefono debe tener entre 7 y 15 digitos y puede empezar con +');
  }
  return limpio;
}

function validarContrasena(contrasena: string): string {
  if (contrasena.length < MINIMO_CONTRASENA || contrasena.length > MAXIMO_CONTRASENA) {
    throw new CiudadanoInvalidoError(`La contrasena debe tener entre ${MINIMO_CONTRASENA} y ${MAXIMO_CONTRASENA} caracteres`);
  }
  return contrasena;
}

// La fecha tiene que existir, no ser futura ni anterior a 1900 y la persona debe tener la edad minima
function validarFechaNacimiento(texto: string, hoy: Date): string {
  const limpio = texto.trim();
  const partes = FORMATO_FECHA.exec(limpio);
  if (partes === null) {
    throw new CiudadanoInvalidoError('La fecha de nacimiento debe tener el formato AAAA-MM-DD');
  }
  const [anio, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  // Date pasa el 30 de febrero a marzo, asi que si cambia el anio, el mes o el dia es porque la fecha no existe
  const existe = fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
  if (!existe || anio < PRIMER_ANIO_VALIDO || fecha.getTime() > hoy.getTime()) {
    throw new CiudadanoInvalidoError('La fecha de nacimiento no es valida');
  }
  if (edadEn(anio, mes, dia, hoy) < EDAD_MINIMA) {
    throw new CiudadanoInvalidoError(`Debes ser mayor de edad (${EDAD_MINIMA} anos o mas) para crear una cuenta`);
  }
  return limpio;
}

// Anos cumplidos hoy y se cuenta con la fecha UTC del servidor, que de noche en Colombia va unas horas adelante
// quien nació un 29 de febrero cumple el 1 de marzo en los anos que no son bisiestos
function edadEn(anio: number, mes: number, dia: number, hoy: Date): number {
  const mesHoy = hoy.getUTCMonth() + 1;
  const yaCumplio = mesHoy > mes || (mesHoy === mes && hoy.getUTCDate() >= dia);
  return hoy.getUTCFullYear() - anio - (yaCumplio ? 0 : 1);
}

function validarGenero(genero: string): Genero {
  if (!(GENEROS as readonly string[]).includes(genero)) {
    throw new CiudadanoInvalidoError(`El genero ${genero} no es valido y debe ser ${GENEROS.join(', ')}`);
  }
  return genero as Genero;
}
