-- Esquema de la base de datos del tablero de micromovilidad
-- Docker ejecuta este archivo solo la primera vez que se crea el volumen de postgres

-- Localidades de la ciudad que aparecen en el filtro Localidad
CREATE TABLE localidades (
  id serial PRIMARY KEY,
  nombre text NOT NULL UNIQUE
);

-- Intersecciones o puntos conocidos donde ocurren los eventos
CREATE TABLE lugares (
  id serial PRIMARY KEY,
  nombre text NOT NULL UNIQUE,
  localidad_id int NOT NULL REFERENCES localidades (id),
  latitud double precision NOT NULL,
  longitud double precision NOT NULL
);

-- Siniestros viales que reporta la secretaria de movilidad
-- sexo y edad solo existen cuando hubo heridos o muertos
CREATE TABLE siniestros (
  id serial PRIMARY KEY,
  ocurrido_en timestamp NOT NULL,
  lugar_id int NOT NULL REFERENCES lugares (id),
  latitud double precision NOT NULL,
  longitud double precision NOT NULL,
  gravedad text NOT NULL CHECK (gravedad IN ('con_muertos', 'con_heridos', 'solo_danos')),
  clase text NOT NULL CHECK (clase IN ('choque', 'atropello', 'caida', 'volcamiento', 'otro')),
  tipo_vehiculo text NOT NULL CHECK (tipo_vehiculo IN ('bicicleta', 'bicicleta_electrica', 'patineta_electrica', 'patineta', 'otro')),
  sexo text CHECK (sexo IN ('mujer', 'hombre')),
  edad int CHECK (edad BETWEEN 0 AND 110)
);

-- Ciclorutas que se dibujan en el mapa con su nivel de riesgo vial
-- trazado es una lista de puntos con forma de latitud y longitud
CREATE TABLE ciclorutas (
  id serial PRIMARY KEY,
  nombre text NOT NULL,
  riesgo text NOT NULL CHECK (riesgo IN ('bajo', 'medio', 'alto')),
  trazado jsonb NOT NULL
);

-- Conteo diario de usuarios de micromovilidad por localidad tipo de vehiculo y fuente
CREATE TABLE conteos_usuarios (
  id serial PRIMARY KEY,
  fecha date NOT NULL,
  localidad_id int NOT NULL REFERENCES localidades (id),
  tipo_vehiculo text NOT NULL CHECK (tipo_vehiculo IN ('bicicleta', 'bicicleta_electrica', 'patineta_electrica', 'patineta', 'otro')),
  fuente text NOT NULL CHECK (fuente IN ('camaras', 'app')),
  cantidad int NOT NULL CHECK (cantidad >= 0)
);

-- Reportes ciudadanos hechos desde la app
-- si motivo_falso_positivo tiene valor el reporte fue descartado como falso positivo
CREATE TABLE reportes (
  id serial PRIMARY KEY,
  creado_en timestamp NOT NULL,
  lugar_id int NOT NULL REFERENCES lugares (id),
  latitud double precision NOT NULL,
  longitud double precision NOT NULL,
  categoria text NOT NULL CHECK (categoria IN ('via_en_mal_estado', 'poca_iluminacion', 'obstaculo_en_cicloruta', 'conductor_imprudente', 'hurto_o_inseguridad')),
  motivo_falso_positivo text CHECK (motivo_falso_positivo IN ('duplicado', 'ubicacion_incorrecta', 'descartado_por_la_comunidad', 'no_corresponde_a_la_categoria'))
);

-- Activaciones del boton de panico desde la app
CREATE TABLE activaciones_panico (
  id serial PRIMARY KEY,
  activado_en timestamp NOT NULL,
  lugar_id int NOT NULL REFERENCES lugares (id),
  latitud double precision NOT NULL,
  longitud double precision NOT NULL
);

-- Indices por fecha porque todas las consultas del tablero filtran por mes
CREATE INDEX siniestros_ocurrido_en_idx ON siniestros (ocurrido_en);
CREATE INDEX conteos_usuarios_fecha_idx ON conteos_usuarios (fecha);
CREATE INDEX reportes_creado_en_idx ON reportes (creado_en);
CREATE INDEX activaciones_panico_activado_en_idx ON activaciones_panico (activado_en);
