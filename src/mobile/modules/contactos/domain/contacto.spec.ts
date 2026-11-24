import { aplicarCambiosContacto, colorLibre, ContactoEmergencia, validarDatosContacto, validarOrden } from './contacto';

const datos = { nombre: '  Maria Lopez ', parentesco: 'Mamá', telefono: '300 123 4567', correo: 'Maria@Correo.com' };
const guardado: ContactoEmergencia = { id: 1, nombre: 'Maria Lopez', parentesco: 'Mamá', telefono: '3001234567', correo: 'maria@correo.com', estado: 'aceptado', color: 0 };

describe('Contacto de emergencia', () => {
  it('limpia los datos: telefono solo con numeros y correo en minusculas', () => {
    expect(validarDatosContacto(datos)).toEqual({ nombre: 'Maria Lopez', parentesco: 'Mamá', telefono: '3001234567', correo: 'maria@correo.com' });
  });

  it('rechaza telefono que no es celular colombiano, nombre vacio o correo malo', () => {
    for (const malo of [{ telefono: '6011234567' }, { telefono: '300123' }, { nombre: '  ' }, { correo: 'no-es-correo' }]) {
      expect(() => validarDatosContacto({ ...datos, ...malo })).toThrow(expect.objectContaining({ codigo: 'CONTACTO_INVALIDO' }));
    }
  });

  it('da el primer color que no esta usado', () => {
    expect(colorLibre([])).toBe(0);
    expect(colorLibre([0, 2])).toBe(1);
  });

  it('si cambia el correo vuelve a quedar pendiente y si no conserva el estado', () => {
    expect(aplicarCambiosContacto(guardado, { correo: 'otra@correo.com' }).estado).toBe('pendiente');
    expect(aplicarCambiosContacto(guardado, { nombre: 'Maria L.' })).toMatchObject({ nombre: 'Maria L.', estado: 'aceptado', color: 0 });
  });

  it('el orden nuevo debe traer exactamente los mismos contactos', () => {
    const dos = [guardado, { ...guardado, id: 2 }];
    expect(() => validarOrden([2, 1], dos)).not.toThrow();
    expect(() => validarOrden([1], dos)).toThrow(expect.objectContaining({ codigo: 'CONTACTO_INVALIDO' }));
    expect(() => validarOrden([1, 1], dos)).toThrow(expect.objectContaining({ codigo: 'CONTACTO_INVALIDO' }));
  });
});
