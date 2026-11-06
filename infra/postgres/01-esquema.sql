-- Esquema de la base de datos safepath
-- Docker ejecuta este archivo solo la primera vez que se crea el volumen de postgres
-- compartido guarda lo que usan la app movil y el dashboard
-- la app escribe los reportes y las activaciones del boton de panico y el dashboard los lee de las mismas tablas
-- dashboard guarda lo que solo usa el tablero y movil lo que solo usa la app

CREATE SCHEMA compartido;
CREATE SCHEMA dashboard;
CREATE SCHEMA movil;

-- ============================== movil ==============================

-- Ciudadanos que usan la app y son los autores de reportes y activaciones
CREATE TABLE movil.usuarios (
  id serial PRIMARY KEY,
  nombre_completo text NOT NULL,
  correo text NOT NULL UNIQUE,
  telefono text,
  creado_en timestamptz NOT NULL DEFAULT now()
);

-- ============================== compartido ==============================

-- Localidades de la ciudad que aparecen en el filtro Localidad
-- el id es el codigo oficial de cada localidad de Bogota
CREATE TABLE compartido.localidades (
  id int PRIMARY KEY,
  nombre text NOT NULL UNIQUE
);

-- Direcciones del anuario de siniestralidad que sirven de referencia para ubicar los eventos
-- la localidad puede faltar porque el anuario no la trae en todos los siniestros
CREATE TABLE compartido.lugares (
  id serial PRIMARY KEY,
  nombre text NOT NULL UNIQUE,
  localidad_id int REFERENCES compartido.localidades (id),
  latitud double precision NOT NULL,
  longitud double precision NOT NULL
);

-- Devuelve el lugar conocido mas cercano a unas coordenadas
-- la app solo manda latitud y longitud y asi el dashboard puede ubicar el evento en un lugar y una localidad
CREATE FUNCTION compartido.lugar_mas_cercano(lat double precision, lon double precision) RETURNS int AS $$
  SELECT id FROM compartido.lugares ORDER BY (latitud - lat) ^ 2 + (longitud - lon) ^ 2 LIMIT 1
$$ LANGUAGE sql STABLE;

-- Tabla maestra de reportes ciudadanos que crea la app y lee el dashboard
-- el estado lo cambia luego la entidad y un reporte descartado es un falso positivo y siempre lleva su motivo
CREATE TABLE compartido.reportes (
  id serial PRIMARY KEY,
  usuario_id int NOT NULL REFERENCES movil.usuarios (id),
  lugar_id int NOT NULL REFERENCES compartido.lugares (id),
  categoria text NOT NULL CHECK (categoria IN ('via_en_mal_estado', 'poca_iluminacion', 'obstaculo_en_cicloruta', 'conductor_imprudente', 'hurto_o_inseguridad')),
  descripcion text CHECK (char_length(descripcion) <= 500),
  latitud double precision NOT NULL CHECK (latitud BETWEEN -90 AND 90),
  longitud double precision NOT NULL CHECK (longitud BETWEEN -180 AND 180),
  estado text NOT NULL DEFAULT 'recibido' CHECK (estado IN ('recibido', 'en_revision', 'resuelto', 'descartado')),
  motivo_falso_positivo text CHECK (motivo_falso_positivo IN ('duplicado', 'ubicacion_incorrecta', 'descartado_por_la_comunidad', 'no_corresponde_a_la_categoria')),
  creado_en timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT descartado_con_motivo CHECK ((estado = 'descartado') = (motivo_falso_positivo IS NOT NULL))
);

-- Tabla maestra de activaciones del boton de panico que crea la app y lee el dashboard
-- una activacion nace activa y luego puede ser atendida o cancelada por el ciudadano
CREATE TABLE compartido.activaciones_panico (
  id serial PRIMARY KEY,
  usuario_id int NOT NULL REFERENCES movil.usuarios (id),
  lugar_id int NOT NULL REFERENCES compartido.lugares (id),
  latitud double precision NOT NULL CHECK (latitud BETWEEN -90 AND 90),
  longitud double precision NOT NULL CHECK (longitud BETWEEN -180 AND 180),
  estado text NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'atendida', 'cancelada')),
  activado_en timestamptz NOT NULL DEFAULT now()
);

-- Conteo diario de usuarios de micromovilidad por localidad y tipo de vehiculo
-- la app movil lo llena y el dashboard lo lee por eso vive en compartido
-- queda vacia hasta que la app movil empiece a contar usuarios
CREATE TABLE compartido.conteos_usuarios (
  id serial PRIMARY KEY,
  fecha date NOT NULL,
  localidad_id int NOT NULL REFERENCES compartido.localidades (id),
  tipo_vehiculo text NOT NULL CHECK (tipo_vehiculo IN ('bicicleta', 'bicicleta_electrica', 'patineta_electrica', 'patineta', 'otro')),
  cantidad int NOT NULL CHECK (cantidad >= 0)
);

-- ============================== dashboard ==============================

-- Siniestros viales del anuario de siniestralidad de la secretaria de movilidad
-- el id es el codigo del siniestro en el anuario y la localidad puede faltar porque el anuario no siempre la trae
-- tipo_vehiculo es bicicleta cuando en el siniestro hubo una bicicleta y otro en los demas casos
CREATE TABLE dashboard.siniestros (
  id bigint PRIMARY KEY,
  ocurrido_en timestamp NOT NULL,
  lugar_id int NOT NULL REFERENCES compartido.lugares (id),
  localidad_id int REFERENCES compartido.localidades (id),
  latitud double precision NOT NULL,
  longitud double precision NOT NULL,
  gravedad text NOT NULL CHECK (gravedad IN ('con_muertos', 'con_heridos', 'solo_danos')),
  clase text NOT NULL CHECK (clase IN ('choque', 'atropello', 'caida', 'volcamiento', 'otro')),
  tipo_vehiculo text NOT NULL CHECK (tipo_vehiculo IN ('bicicleta', 'bicicleta_electrica', 'patineta_electrica', 'patineta', 'otro'))
);

-- Personas que estuvieron en cada siniestro del anuario con su sexo edad y gravedad
-- el anuario no trae sexo o edad de algunas personas y por eso pueden faltar
CREATE TABLE dashboard.actores_viales (
  id bigint PRIMARY KEY,
  siniestro_id bigint NOT NULL REFERENCES dashboard.siniestros (id),
  condicion text NOT NULL CHECK (condicion IN ('conductor', 'motociclista', 'ciclista', 'pasajero', 'peaton')),
  gravedad text CHECK (gravedad IN ('ileso', 'herido', 'muerto')),
  sexo text CHECK (sexo IN ('mujer', 'hombre')),
  edad int CHECK (edad BETWEEN 0 AND 110)
);

-- Usuarios del dashboard institucional con su rol
-- admin puede crear editar y eliminar usuarios y lector solo puede ver la informacion
-- la contrasena se agregara cuando exista el login real con JWT
CREATE TABLE dashboard.usuarios (
  id serial PRIMARY KEY,
  nombre_completo text NOT NULL CHECK (char_length(nombre_completo) BETWEEN 1 AND 120),
  correo text NOT NULL UNIQUE,
  rol text NOT NULL DEFAULT 'lector' CHECK (rol IN ('admin', 'lector')),
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

-- ============================== indices ==============================

-- Por fecha porque el tablero filtra por mes y la app lista lo mas reciente primero
CREATE INDEX reportes_creado_en_idx ON compartido.reportes (creado_en);
CREATE INDEX activaciones_panico_activado_en_idx ON compartido.activaciones_panico (activado_en);
CREATE INDEX siniestros_ocurrido_en_idx ON dashboard.siniestros (ocurrido_en);
CREATE INDEX conteos_usuarios_fecha_idx ON compartido.conteos_usuarios (fecha);

-- Por siniestro porque la grafica de sexo y edad une cada siniestro con sus personas
CREATE INDEX actores_viales_siniestro_id_idx ON dashboard.actores_viales (siniestro_id);

-- Por ciudadano porque la app lista los reportes y activaciones de un usuario
CREATE INDEX reportes_usuario_id_idx ON compartido.reportes (usuario_id);
CREATE INDEX activaciones_panico_usuario_id_idx ON compartido.activaciones_panico (usuario_id);
