-- Datos reales del Anuario de Siniestralidad Vial 2025 de la secretaria de movilidad
-- el dashboard solo muestra datos del anuario y lo que el anuario no trae queda en cero
-- reportes activaciones del boton de panico conteos de usuarios y ciudadanos de la app quedan vacios
-- los unicos datos de prueba son los usuarios del dashboard para el login
-- los csv de la carpeta datos tienen las columnas del Excel del anuario sin transformar

-- Carpeta donde esta este script dentro del contenedor y fuera de docker se cambia con psql -v carpeta=infra/postgres
\if :{?carpeta}
\else
  \set carpeta /docker-entrypoint-initdb.d
\endif

-- ============================== compartido: localidades ==============================

-- Las veinte localidades de Bogota con su codigo oficial y el nombre como lo escribe el anuario
CREATE TEMP TABLE localidades_anuario (id int, nombre text, nombre_anuario text);
INSERT INTO localidades_anuario VALUES
  (1, 'Usaquén', 'USAQUÉN'),
  (2, 'Chapinero', 'CHAPINERO'),
  (3, 'Santa Fe', 'SANTA FE'),
  (4, 'San Cristóbal', 'SAN CRISTÓBAL'),
  (5, 'Usme', 'USME'),
  (6, 'Tunjuelito', 'TUNJUELITO'),
  (7, 'Bosa', 'BOSA'),
  (8, 'Kennedy', 'KENNEDY'),
  (9, 'Fontibón', 'FONTIBÓN'),
  (10, 'Engativá', 'ENGATIVÁ'),
  (11, 'Suba', 'SUBA'),
  (12, 'Barrios Unidos', 'BARRIOS UNIDOS'),
  (13, 'Teusaquillo', 'TEUSAQUILLO'),
  (14, 'Los Mártires', 'LOS MÁRTIRES'),
  (15, 'Antonio Nariño', 'ANTONIO NARIÑO'),
  (16, 'Puente Aranda', 'PUENTE ARANDA'),
  (17, 'La Candelaria', 'CANDELARIA'),
  (18, 'Rafael Uribe Uribe', 'RAFAEL URIBE URIBE'),
  (19, 'Ciudad Bolívar', 'CIUDAD BOLÍVAR'),
  (20, 'Sumapaz', 'SUMAPAZ');

INSERT INTO compartido.localidades (id, nombre) SELECT id, nombre FROM localidades_anuario;

-- ============================== lectura de los csv del anuario ==============================

CREATE TEMP TABLE anuario_siniestros (
  codigo_siniestro bigint, fecha date, hora int, minuto int, direccion text, localidad text,
  latitud text, longitud text, clase text, gravedad text, con_bicicleta text
);
CREATE TEMP TABLE anuario_actores_viales (
  codigo_accidentado bigint, codigo_siniestro bigint, condicion text, gravedad text, sexo text, edad int
);

-- copy no acepta variables en la ruta por eso primero se entra a la carpeta
\cd :carpeta
\copy anuario_siniestros FROM 'datos/anuario-siniestros.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')
\copy anuario_actores_viales FROM 'datos/anuario-actores-viales.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')

-- El anuario escribe las coordenadas con coma decimal y la localidad en mayusculas
CREATE TEMP TABLE siniestros_limpios AS
SELECT
  a.codigo_siniestro,
  a.fecha + make_time(a.hora, a.minuto, 0) AS ocurrido_en,
  a.direccion,
  l.id AS localidad_id,
  replace(a.latitud, ',', '.')::double precision AS latitud,
  replace(a.longitud, ',', '.')::double precision AS longitud,
  a.clase,
  a.gravedad,
  a.con_bicicleta
FROM anuario_siniestros a
LEFT JOIN localidades_anuario l ON l.nombre_anuario = a.localidad;

-- ============================== compartido: lugares ==============================

-- Cada direccion del anuario es un lugar en el punto medio de sus siniestros
-- si una direccion aparece en varias localidades se queda con la que mas se repite
INSERT INTO compartido.lugares (nombre, localidad_id, latitud, longitud)
SELECT direccion, mode() WITHIN GROUP (ORDER BY localidad_id), avg(latitud), avg(longitud)
FROM siniestros_limpios
GROUP BY direccion
ORDER BY direccion;

-- ============================== dashboard: siniestros y actores viales ==============================

INSERT INTO dashboard.siniestros (id, ocurrido_en, lugar_id, localidad_id, latitud, longitud, gravedad, clase, tipo_vehiculo)
SELECT
  s.codigo_siniestro,
  s.ocurrido_en,
  lu.id,
  s.localidad_id,
  s.latitud,
  s.longitud,
  CASE s.gravedad WHEN 'Con Muertos' THEN 'con_muertos' WHEN 'Con Heridos' THEN 'con_heridos' ELSE 'solo_danos' END,
  CASE s.clase
    WHEN 'Choque' THEN 'choque'
    WHEN 'Atropello' THEN 'atropello'
    WHEN 'Caida de ocupante' THEN 'caida'
    WHEN 'Volcamiento' THEN 'volcamiento'
    ELSE 'otro'
  END,
  -- El anuario marca con SI los siniestros donde hubo una bicicleta
  CASE WHEN s.con_bicicleta = 'SI' THEN 'bicicleta' ELSE 'otro' END
FROM siniestros_limpios s
JOIN compartido.lugares lu ON lu.nombre = s.direccion;

INSERT INTO dashboard.actores_viales (id, siniestro_id, condicion, gravedad, sexo, edad)
SELECT
  a.codigo_accidentado,
  a.codigo_siniestro,
  CASE a.condicion WHEN 'PEATÓN' THEN 'peaton' ELSE lower(a.condicion) END,
  lower(a.gravedad),
  CASE a.sexo WHEN 'Femenino' THEN 'mujer' WHEN 'Masculino' THEN 'hombre' END,
  a.edad
FROM anuario_actores_viales a;

-- ============================== dashboard: usuarios para el login ==============================

INSERT INTO dashboard.usuarios (nombre_completo, correo, rol) VALUES
  ('Admin Demo', 'admin@demo.local', 'admin'),
  ('Laura Gomez', 'laura.gomez@demo.local', 'admin'),
  ('Carlos Perez', 'carlos.perez@demo.local', 'lector');
