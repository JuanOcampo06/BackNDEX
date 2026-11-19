// Version de los terminos y condiciones que acepta el ciudadano al registrarse
// es la fecha de la ultima actualizacion que muestra la app (octubre de 2026) y cuando cambien los terminos hay que subirla
export const VERSION_TERMINOS = '2026-10';

// Constancia de que el ciudadano acepto los terminos: cual version y cuando
export interface AceptacionTerminos {
  version: string;
  aceptadoEn: Date;
}
