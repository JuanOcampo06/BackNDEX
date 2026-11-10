// Opciones de genero que la app ofrece al registrarse
// la app muestra Femenino, Masculino, No binario y Prefiero no decirlo y manda estos valores
export const GENEROS = ['femenino', 'masculino', 'no_binario', 'prefiero_no_decirlo'] as const;
export type Genero = (typeof GENEROS)[number];
