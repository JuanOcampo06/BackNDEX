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
-- la contrasena se guarda cifrada con scrypt en el formato scrypt$sal$clave y nunca en texto plano
-- que sea mayor de 18 anos lo valida el backend al registrar porque depende de la fecha de hoy
CREATE TABLE movil.usuarios (
  id serial PRIMARY KEY,
  nombre_completo text NOT NULL,
  correo text NOT NULL UNIQUE,
  telefono text,
  fecha_nacimiento date NOT NULL CHECK (fecha_nacimiento >= DATE '1900-01-01'),
  genero text NOT NULL CHECK (genero IN ('femenino', 'masculino', 'no_binario', 'prefiero_no_decirlo')),
  contrasena_cifrada text NOT NULL,
  creado_en timestamptz NOT NULL DEFAULT now()
);

-- Viajes en bicicleta del ciudadano
-- un viaje nace en curso y al finalizarlo se guarda la distancia recorrida en metros
CREATE TABLE movil.viajes (
  id serial PRIMARY KEY,
  usuario_id int NOT NULL REFERENCES movil.usuarios (id),
  estado text NOT NULL DEFAULT 'en_curso' CHECK (estado IN ('en_curso', 'finalizado')),
  distancia_m double precision NOT NULL DEFAULT 0 CHECK (distancia_m >= 0),
  iniciado_en timestamptz NOT NULL DEFAULT now(),
  finalizado_en timestamptz,
  CONSTRAINT finalizado_con_fecha CHECK ((estado = 'finalizado') = (finalizado_en IS NOT NULL))
);

-- Puntos GPS del recorrido y el primero es la salida del viaje
CREATE TABLE movil.puntos_viaje (
  id serial PRIMARY KEY,
  viaje_id int NOT NULL REFERENCES movil.viajes (id) ON DELETE CASCADE,
  latitud double precision NOT NULL CHECK (latitud BETWEEN -90 AND 90),
  longitud double precision NOT NULL CHECK (longitud BETWEEN -180 AND 180),
  registrado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX viajes_usuario_id_idx ON movil.viajes (usuario_id);
CREATE INDEX puntos_viaje_viaje_id_idx ON movil.puntos_viaje (viaje_id);
-- La base garantiza que un ciudadano tenga un solo viaje en curso a la vez
CREATE UNIQUE INDEX viajes_un_en_curso_por_usuario_idx ON movil.viajes (usuario_id) WHERE estado = 'en_curso';

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

-- Catalogo de categorias y subcategorias de reporte que muestra la app
-- el ciudadano elige una categoria principal y luego una de sus subcategorias
-- el dashboard solo agrupa por la categoria principal y asi suma todas sus subcategorias
CREATE TABLE compartido.subcategorias_reporte (
  id text PRIMARY KEY,
  categoria text NOT NULL CHECK (categoria IN ('danos_en_la_via', 'transito', 'seguridad', 'otro')),
  UNIQUE (categoria, id)
);

INSERT INTO compartido.subcategorias_reporte (categoria, id) VALUES
  ('danos_en_la_via', 'hueco'),
  ('danos_en_la_via', 'obra'),
  ('danos_en_la_via', 'via_cerrada'),
  ('transito', 'accidente'),
  ('transito', 'semaforo_danado'),
  ('seguridad', 'robo'),
  ('seguridad', 'poca_luz'),
  ('seguridad', 'policia'),
  ('otro', 'otro');

-- Tabla maestra de reportes ciudadanos que crea la app y lee el dashboard
-- el estado lo cambia luego la entidad y un reporte descartado es un falso positivo y siempre lleva su motivo
CREATE TABLE compartido.reportes (
  id serial PRIMARY KEY,
  usuario_id int NOT NULL REFERENCES movil.usuarios (id),
  lugar_id int NOT NULL REFERENCES compartido.lugares (id),
  categoria text NOT NULL,
  subcategoria text NOT NULL,
  -- Vehiculo en el que iba el ciudadano y sirve para el filtro Vehiculo del dashboard
  tipo_vehiculo text NOT NULL CHECK (tipo_vehiculo IN ('bicicleta', 'bicicleta_electrica', 'patineta_electrica', 'patineta', 'otro')),
  descripcion text CHECK (char_length(descripcion) <= 500),
  latitud double precision NOT NULL CHECK (latitud BETWEEN -90 AND 90),
  longitud double precision NOT NULL CHECK (longitud BETWEEN -180 AND 180),
  estado text NOT NULL DEFAULT 'recibido' CHECK (estado IN ('recibido', 'en_revision', 'resuelto', 'descartado')),
  motivo_falso_positivo text CHECK (motivo_falso_positivo IN ('duplicado', 'ubicacion_incorrecta', 'descartado_por_la_comunidad', 'no_corresponde_a_la_categoria')),
  creado_en timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT descartado_con_motivo CHECK ((estado = 'descartado') = (motivo_falso_positivo IS NOT NULL)),
  -- La base no acepta una subcategoria que no pertenezca a la categoria elegida
  CONSTRAINT subcategoria_de_su_categoria FOREIGN KEY (categoria, subcategoria)
    REFERENCES compartido.subcategorias_reporte (categoria, id)
);

-- Tabla maestra de activaciones del boton de panico que crea la app y lee el dashboard
-- una activacion nace activa y luego puede ser atendida o cancelada por el ciudadano
CREATE TABLE compartido.activaciones_panico (
  id serial PRIMARY KEY,
  usuario_id int NOT NULL REFERENCES movil.usuarios (id),
  lugar_id int NOT NULL REFERENCES compartido.lugares (id),
  -- Vehiculo en el que iba el ciudadano y sirve para el filtro Vehiculo del dashboard
  tipo_vehiculo text NOT NULL CHECK (tipo_vehiculo IN ('bicicleta', 'bicicleta_electrica', 'patineta_electrica', 'patineta', 'otro')),
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

-- Usuarios del dashboard institucional con su rol y son los que inician sesion en el tablero
-- admin puede crear editar y eliminar usuarios y lector solo puede ver la informacion
-- la contrasena se guarda cifrada con scrypt en el formato scrypt$sal$clave y nunca en texto plano
-- sin contrasena el usuario no puede entrar hasta que se la asignen o la restablezca
CREATE TABLE dashboard.usuarios (
  id serial PRIMARY KEY,
  nombre_completo text NOT NULL CHECK (char_length(nombre_completo) BETWEEN 1 AND 120),
  correo text NOT NULL UNIQUE,
  rol text NOT NULL DEFAULT 'lector' CHECK (rol IN ('admin', 'lector')),
  entidad text CHECK (char_length(entidad) BETWEEN 1 AND 120),
  contrasena_cifrada text,
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

-- Solicitudes para restablecer la contrasena de un usuario del dashboard
-- solo se guarda el hash del token que se envia al correo y cada token sirve una sola vez antes de vencer
CREATE TABLE dashboard.restablecimientos_contrasena (
  id serial PRIMARY KEY,
  usuario_id int NOT NULL REFERENCES dashboard.usuarios (id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  vence_en timestamptz NOT NULL,
  usado_en timestamptz,
  creado_en timestamptz NOT NULL DEFAULT now()
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
