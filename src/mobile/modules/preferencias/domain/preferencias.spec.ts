import { aplicarCambios, PREFERENCIAS_POR_DEFECTO } from './preferencias';

describe('aplicarCambios', () => {
  it('cambia solo lo que se manda y deja igual el resto', () => {
    const nuevas = aplicarCambios(PREFERENCIAS_POR_DEFECTO, { tema: 'oscuro', alertas: { sonido: true } });

    expect(nuevas).toEqual({
      ...PREFERENCIAS_POR_DEFECTO,
      tema: 'oscuro',
      alertas: { ...PREFERENCIAS_POR_DEFECTO.alertas, sonido: true },
    });
  });

  it('sin cambios devuelve lo mismo', () => {
    expect(aplicarCambios(PREFERENCIAS_POR_DEFECTO, {})).toEqual(PREFERENCIAS_POR_DEFECTO);
  });

  it('rechaza opciones que no existen', () => {
    expect(() => aplicarCambios(PREFERENCIAS_POR_DEFECTO, { tema: 'azul' })).toThrow(expect.objectContaining({ codigo: 'PREFERENCIAS_INVALIDAS' }));
    expect(() => aplicarCambios(PREFERENCIAS_POR_DEFECTO, { avatar: 'dragon' })).toThrow(expect.objectContaining({ codigo: 'PREFERENCIAS_INVALIDAS' }));
    expect(() => aplicarCambios(PREFERENCIAS_POR_DEFECTO, { alertas: { distanciaM: 250 } })).toThrow(
      expect.objectContaining({ codigo: 'PREFERENCIAS_INVALIDAS' }),
    );
  });
});
