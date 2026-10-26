// Revisa que una latitud y una longitud sean numeros reales dentro de los rangos del planeta
// lo usan los modulos que reciben una ubicacion como reportes y sos
export function coordenadasValidas(latitud: number, longitud: number): boolean {
  return (
    Number.isFinite(latitud) &&
    Number.isFinite(longitud) &&
    latitud >= -90 &&
    latitud <= 90 &&
    longitud >= -180 &&
    longitud <= 180
  );
}
