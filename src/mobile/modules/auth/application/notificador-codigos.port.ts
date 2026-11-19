export const NOTIFICADOR_CODIGOS = Symbol('NOTIFICADOR_CODIGOS');

export interface AvisoCodigo {
  correo: string;
  nombreCompleto: string;
  codigo: string;
  venceEn: Date;
}

// Puerto para hacerle llegar al ciudadano los codigos de un solo uso
export interface NotificadorCodigosPort {
  // El codigo para restablecer la contrasena
  enviarRestablecimiento(aviso: AvisoCodigo): Promise<void>;
  // El codigo para verificar el correo al registrarse
  enviarVerificacion(aviso: AvisoCodigo): Promise<void>;
}
