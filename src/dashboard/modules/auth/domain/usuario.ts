import { DomainError } from '../../../../shared/domain-error';

export interface DatosUsuario {
  id: string;
  nombreCompleto: string;
  correo: string;
  rol: string;
  contrasena: string;
}

export class Usuario {
  readonly id: string;
  readonly nombreCompleto: string;
  readonly correo: string;
  readonly rol: string;
  private readonly contrasena: string;

  constructor(datos: DatosUsuario) {
    for (const [campo, valor] of Object.entries(datos)) {
      if (valor.trim() === '') {
        throw new DomainError('USUARIO_INVALIDO', `El campo ${campo} es obligatorio`);
      }
    }
    this.id = datos.id;
    this.nombreCompleto = datos.nombreCompleto;
    this.correo = datos.correo;
    this.rol = datos.rol;
    this.contrasena = datos.contrasena;
  }

  // Demo: comparación en texto plano; el hashing llegará con la base de datos real.
  tieneContrasena(contrasena: string): boolean {
    return this.contrasena === contrasena;
  }
}
