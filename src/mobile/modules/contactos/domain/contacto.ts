import { ContactoInvalidoError } from './contacto-invalido.error';

// Maximo de contactos de emergencia por ciudadano, igual que en la app
export const MAXIMO_CONTACTOS = 3;

// En que va la invitacion que le llega al contacto por correo: solo los aceptados salen en el boton SOS
// un rechazado queda en la lista para que la app avise al ciudadano y luego lo borre; no cuenta para el maximo
export const ESTADOS_CONTACTO = ['pendiente', 'aceptado', 'rechazado'] as const;
export type EstadoContacto = (typeof ESTADOS_CONTACTO)[number];

// Lo que el contacto puede contestar a la invitacion
export const RESPUESTAS_INVITACION = ['acepto', 'rechazo'] as const;
export type RespuestaInvitacion = (typeof RESPUESTAS_INVITACION)[number];

// La invitacion sirve una semana y despues el ciudadano tiene que reenviarla
export const DIAS_DE_VIGENCIA_INVITACION = 7;
// Para no llenar de correos al contacto, una invitacion nueva solo se envia pasado este tiempo
export const SEGUNDOS_ENTRE_INVITACIONES = 60;

// Color del circulo del contacto en la app (0 coral, 1 azul, 2 amarillo): se elige al crearlo y no cambia
export const COLORES_CONTACTO = [0, 1, 2] as const;
export type ColorContacto = (typeof COLORES_CONTACTO)[number];

// Mismos limites que el formulario de la app
const MAXIMO_NOMBRE = 60;
const MAXIMO_PARENTESCO = 30;
const MAXIMO_CORREO = 254;
// Celular colombiano: 10 numeros que empiezan por 3
const CELULAR_COLOMBIANO = /^3\d{9}$/;
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Contacto ya guardado: el id lo pone la base de datos
export interface ContactoEmergencia {
  id: number;
  nombre: string;
  parentesco: string;
  telefono: string;
  correo: string;
  estado: EstadoContacto;
  color: ColorContacto;
}

// Datos que escribe el ciudadano en el formulario
export interface DatosContacto {
  nombre: string;
  parentesco: string;
  telefono: string;
  correo: string;
}

// Lo que se recibe para cambiar un contacto: solo los campos que cambian
// el estado no se cambia aqui: solo lo cambia el contacto al contestar la invitacion
export interface CambiosContacto {
  nombre?: string;
  parentesco?: string;
  telefono?: string;
  correo?: string;
}

// Aplica las reglas a los datos del formulario y los devuelve limpios (telefono solo con numeros y correo en minusculas)
export function validarDatosContacto(datos: DatosContacto): DatosContacto {
  const nombre = datos.nombre.trim();
  const parentesco = datos.parentesco.trim();
  const telefono = datos.telefono.replace(/\D/g, '');
  const correo = datos.correo.trim().toLowerCase();
  if (nombre.length === 0 || nombre.length > MAXIMO_NOMBRE) {
    throw new ContactoInvalidoError(`El nombre debe tener entre 1 y ${MAXIMO_NOMBRE} caracteres`);
  }
  if (parentesco.length > MAXIMO_PARENTESCO) {
    throw new ContactoInvalidoError(`El parentesco no puede pasar de ${MAXIMO_PARENTESCO} caracteres`);
  }
  if (!CELULAR_COLOMBIANO.test(telefono)) {
    throw new ContactoInvalidoError('El telefono debe ser un celular colombiano de 10 numeros que empiece por 3');
  }
  if (correo.length > MAXIMO_CORREO || !CORREO.test(correo)) {
    throw new ContactoInvalidoError('El correo no es valido');
  }
  return { nombre, parentesco, telefono, correo };
}

// Primer color que no usa ningun otro contacto del ciudadano (coral, luego azul, luego amarillo)
export function colorLibre(usados: ColorContacto[]): ColorContacto {
  return COLORES_CONTACTO.find((color) => !usados.includes(color)) ?? COLORES_CONTACTO[0];
}

// Junta el contacto con los cambios; si cambia el correo la invitacion vuelve a quedar pendiente y hay que enviarla otra vez
export function aplicarCambiosContacto(actual: ContactoEmergencia, cambios: CambiosContacto): ContactoEmergencia {
  const datos = validarDatosContacto({
    nombre: cambios.nombre ?? actual.nombre,
    parentesco: cambios.parentesco ?? actual.parentesco,
    telefono: cambios.telefono ?? actual.telefono,
    correo: cambios.correo ?? actual.correo,
  });
  const estado = datos.correo !== actual.correo ? 'pendiente' : actual.estado;
  return { ...actual, ...datos, estado };
}

// Los rechazados no cuentan para el maximo ni ocupan color
export function contactosVigentes(contactos: ContactoEmergencia[]): ContactoEmergencia[] {
  return contactos.filter((contacto) => contacto.estado !== 'rechazado');
}

export function estadoPorRespuesta(respuesta: RespuestaInvitacion): EstadoContacto {
  return respuesta === 'acepto' ? 'aceptado' : 'rechazado';
}

// El nuevo orden tiene que traer exactamente los contactos del ciudadano, cada uno una vez
export function validarOrden(ids: number[], actuales: ContactoEmergencia[]): void {
  const esperados = actuales.map((contacto) => contacto.id).sort((a, b) => a - b);
  const recibidos = [...ids].sort((a, b) => a - b);
  if (esperados.length !== recibidos.length || esperados.some((id, i) => id !== recibidos[i])) {
    throw new ContactoInvalidoError('El orden debe traer todos los contactos del ciudadano, cada uno una vez');
  }
}
