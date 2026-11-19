// Reglas de la contrasena de los usuarios del dashboard iguales a las que valida el frontend
// las letras con tilde y la enie cuentan como mayuscula o minuscula
const MINIMO = 8;
const MAXIMO = 72;
const MAYUSCULA = /\p{Lu}/u;
const MINUSCULA = /\p{Ll}/u;
const NUMERO = /\d/;

export const MENSAJE_REGLAS_CONTRASENA = `La contraseña debe tener entre ${MINIMO} y ${MAXIMO} caracteres, una mayúscula, una minúscula y un número`;

export function contrasenaCumpleReglas(contrasena: string): boolean {
  return (
    contrasena.length >= MINIMO &&
    contrasena.length <= MAXIMO &&
    MAYUSCULA.test(contrasena) &&
    MINUSCULA.test(contrasena) &&
    NUMERO.test(contrasena)
  );
}
