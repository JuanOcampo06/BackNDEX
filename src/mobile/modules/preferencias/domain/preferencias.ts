import { PreferenciasInvalidasError } from './preferencias-invalidas.error';

// Opciones que muestra la app en Perfil
export const TEMAS = ['claro', 'oscuro', 'sistema'] as const;
export type Tema = (typeof TEMAS)[number];

// Como se ve el ciudadano en el mapa durante la ruta: un avatar de la app o el vehiculo en el que va
export const AVATARES = ['vehiculo', 'flecha', 'chiva', 'tortuga', 'bicicleta', 'bicicleta_electrica', 'patineta'] as const;
export type Avatar = (typeof AVATARES)[number];

// A cuantos metros de un reporte se avisa
export const DISTANCIAS_ALERTA_M = [100, 300, 500] as const;
export type DistanciaAlertaM = (typeof DISTANCIAS_ALERTA_M)[number];

export interface Alertas {
  reportesCercanos: boolean;
  sonido: boolean;
  vibracion: boolean;
  distanciaM: DistanciaAlertaM;
}

// Lo que el ciudadano configura en la app y se guarda en su cuenta para verlo igual en cualquier celular
export interface Preferencias {
  tema: Tema;
  avatar: Avatar;
  alertas: Alertas;
  voz: boolean;
  notificacionesRuta: boolean;
}

// Lo que se recibe para cambiar: solo los campos que cambian, tambien dentro de alertas
export interface CambiosPreferencias {
  tema?: string;
  avatar?: string;
  alertas?: Partial<Omit<Alertas, 'distanciaM'>> & { distanciaM?: number };
  voz?: boolean;
  notificacionesRuta?: boolean;
}

// Lo que ve un ciudadano que nunca ha guardado nada: los mismos valores con los que arranca la app
export const PREFERENCIAS_POR_DEFECTO: Preferencias = {
  tema: 'sistema',
  avatar: 'flecha',
  alertas: { reportesCercanos: true, sonido: false, vibracion: true, distanciaM: 300 },
  voz: true,
  notificacionesRuta: true,
};

// Junta lo que ya estaba guardado con los cambios y revisa que todo sea una opcion que existe
export function aplicarCambios(actuales: Preferencias, cambios: CambiosPreferencias): Preferencias {
  const tema = cambios.tema ?? actuales.tema;
  const avatar = cambios.avatar ?? actuales.avatar;
  const distanciaM = cambios.alertas?.distanciaM ?? actuales.alertas.distanciaM;
  if (!esTema(tema)) {
    throw new PreferenciasInvalidasError(`El tema ${tema} no existe`);
  }
  if (!esAvatar(avatar)) {
    throw new PreferenciasInvalidasError(`El avatar ${avatar} no existe`);
  }
  if (!esDistancia(distanciaM)) {
    throw new PreferenciasInvalidasError(`La distancia de alerta debe ser ${DISTANCIAS_ALERTA_M.join(', ')} metros`);
  }
  return {
    tema,
    avatar,
    alertas: {
      reportesCercanos: cambios.alertas?.reportesCercanos ?? actuales.alertas.reportesCercanos,
      sonido: cambios.alertas?.sonido ?? actuales.alertas.sonido,
      vibracion: cambios.alertas?.vibracion ?? actuales.alertas.vibracion,
      distanciaM,
    },
    voz: cambios.voz ?? actuales.voz,
    notificacionesRuta: cambios.notificacionesRuta ?? actuales.notificacionesRuta,
  };
}

function esTema(valor: string): valor is Tema {
  return (TEMAS as readonly string[]).includes(valor);
}

function esAvatar(valor: string): valor is Avatar {
  return (AVATARES as readonly string[]).includes(valor);
}

function esDistancia(valor: number): valor is DistanciaAlertaM {
  return (DISTANCIAS_ALERTA_M as readonly number[]).includes(valor);
}
