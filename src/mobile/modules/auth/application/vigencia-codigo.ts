// El codigo dura un cuarto de hora y despues hay que pedir otro
const MINUTOS_DE_VIGENCIA = 15;

// Para que nadie llene de correos a un ciudadano, un codigo nuevo solo se envia pasado este tiempo
const SEGUNDOS_ENTRE_SOLICITUDES = 60;

const MS_POR_MINUTO = 60 * 1000;
const MS_POR_SEGUNDO = 1000;

// Fecha desde la que una solicitud anterior todavia cuenta como reciente y fecha en que vence el codigo nuevo
export function fechasDelCodigo(ahora: Date): { desde: Date; venceEn: Date } {
  return {
    desde: new Date(ahora.getTime() - SEGUNDOS_ENTRE_SOLICITUDES * MS_POR_SEGUNDO),
    venceEn: new Date(ahora.getTime() + MINUTOS_DE_VIGENCIA * MS_POR_MINUTO),
  };
}
