import { BadRequestException, ParseIntPipe, ValidationError, ValidationPipe, ValidationPipeOptions } from '@nestjs/common';

// Codigo de los errores de datos invalidos con el mismo formato codigo y mensaje que el resto del dashboard
const CODIGO = 'DATOS_INVALIDOS';

// Lo que viene despues de los dos puntos o el numero dentro del mensaje original de class-validator
const despuesDeDosPuntos = (texto: string) => texto.split(': ').slice(1).join(': ');
const numeroDe = (texto: string) => texto.match(/-?\d+(\.\d+)?/)?.[0] ?? '';

// Mensaje en espanol para cada regla de class-validator
const TRADUCCIONES: Record<string, (campo: string, original: string) => string> = {
  whitelistValidation: (campo) => `El campo ${campo} no existe`,
  isEmail: (campo) => `${campo} debe ser un correo válido`,
  isString: (campo) => `${campo} debe ser texto`,
  isNotEmpty: (campo) => `${campo} no puede estar vacío`,
  isIn: (campo, original) => `${campo} debe ser uno de: ${despuesDeDosPuntos(original)}`,
  isInt: (campo) => `${campo} debe ser un número entero`,
  isNumber: (campo) => `${campo} debe ser un número`,
  min: (campo, original) => `${campo} no puede ser menor que ${numeroDe(original)}`,
  max: (campo, original) => `${campo} no puede ser mayor que ${numeroDe(original)}`,
  minLength: (campo, original) => `${campo} debe tener al menos ${numeroDe(original)} caracteres`,
  maxLength: (campo, original) => `${campo} no puede tener más de ${numeroDe(original)} caracteres`,
  matches: (campo) => `${campo} no tiene el formato correcto`,
  isArray: (campo) => `${campo} debe traer uno o varios valores`,
  arrayNotEmpty: (campo) => `${campo} debe traer al menos un valor`,
};

// Los mensajes automaticos de class-validator estan en ingles y los que ya escribimos en espanol se dejan igual
const esMensajeAutomatico = (texto: string) => / must | should not exist/.test(texto);

function mensajes(errores: ValidationError[], prefijo = ''): string[] {
  return errores.flatMap((error) => {
    const campo = `${prefijo}${error.property}`;
    // Un campo que no llego tiene un solo mensaje claro en vez de una lista de reglas
    if (error.value === undefined && error.constraints && !error.constraints.whitelistValidation) {
      return [`El campo ${campo} es obligatorio`];
    }
    const propios = Object.entries(error.constraints ?? {}).map(([regla, original]) =>
      esMensajeAutomatico(original) && TRADUCCIONES[regla] ? TRADUCCIONES[regla](campo, original) : original,
    );
    return [...propios, ...mensajes(error.children ?? [], `${campo}.`)];
  });
}

// ValidationPipe del dashboard que responde 400 con codigo DATOS_INVALIDOS y el mensaje en espanol
// por defecto convierte los tipos y rechaza los campos que no existen
export function crearValidador(opciones: ValidationPipeOptions = {}): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    ...opciones,
    exceptionFactory: (errores) => new BadRequestException({ codigo: CODIGO, mensaje: mensajes(errores).join('. ') }),
  });
}

// Revisa el id de la url y responde en espanol cuando no es un numero entero
export const validarId = new ParseIntPipe({
  exceptionFactory: () => new BadRequestException({ codigo: CODIGO, mensaje: 'El id debe ser un número entero' }),
});
