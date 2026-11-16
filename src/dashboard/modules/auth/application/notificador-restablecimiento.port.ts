export const NOTIFICADOR_RESTABLECIMIENTO = Symbol('NOTIFICADOR_RESTABLECIMIENTO');

export interface AvisoRestablecimiento {
  correo: string;
  nombreCompleto: string;
  token: string;
  venceEn: Date;
}

// Puerto para hacerle llegar al usuario el enlace para restablecer su contrasena
export interface NotificadorRestablecimientoPort {
  enviar(aviso: AvisoRestablecimiento): Promise<void>;
}
