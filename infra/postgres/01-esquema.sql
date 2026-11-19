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
  fecha_nacimiento date NOT NULL CHECK (fecha_nacimiento >= DATE '1900-01-01'),
  genero text NOT NULL CHECK (genero IN ('femenino', 'masculino', 'no_binario', 'prefiero_no_decirlo')),
  contrasena_cifrada text NOT NULL,
  -- true cuando el ciudadano acepto los terminos y condiciones al registrarse y la constancia esta en movil.aceptaciones_terminos
  acepto_terminos boolean NOT NULL DEFAULT false,
  -- true cuando el ciudadano escribio en la app el codigo que le llego al correo al registrarse
  correo_verificado boolean NOT NULL DEFAULT false,
  creado_en timestamptz NOT NULL DEFAULT now()
);

-- Codigos para verificar el correo de un ciudadano al registrarse y llegan a ese correo
-- tiene las mismas columnas y reglas que movil.restablecimientos_contrasena: solo se guarda el hash, sirve una sola vez y se bloquea tras varios intentos
CREATE TABLE movil.verificaciones_correo (
  id serial PRIMARY KEY,
  usuario_id int NOT NULL REFERENCES movil.usuarios (id) ON DELETE CASCADE,
  codigo_hash text NOT NULL,
  intentos int NOT NULL DEFAULT 0 CHECK (intentos >= 0),
  vence_en timestamptz NOT NULL,
  usado_en timestamptz,
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX verificaciones_correo_usuario_idx ON movil.verificaciones_correo (usuario_id);

-- Constancia de que el ciudadano acepto los terminos y condiciones: cual version y cuando
-- se guarda una fila por cada version que acepta y asi si los terminos cambian se puede pedir que acepte la nueva
CREATE TABLE movil.aceptaciones_terminos (
  id serial PRIMARY KEY,
  usuario_id int NOT NULL REFERENCES movil.usuarios (id) ON DELETE CASCADE,
  version_terminos text NOT NULL,
  aceptado_en timestamptz NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, version_terminos)
);

-- Viajes en bicicleta del ciudadano
-- un viaje nace en curso y al finalizarlo se guarda la distancia recorrida en metros
CREATE TABLE movil.viajes (
  id serial PRIMARY KEY,
  usuario_id int NOT NULL REFERENCES movil.usuarios (id),
  -- Vehiculo en el que va el ciudadano y es el mismo que se elige al reportar o al activar el boton de panico
  tipo_vehiculo text NOT NULL CHECK (tipo_vehiculo IN ('bicicleta', 'bicicleta_electrica', 'patineta_electrica', 'patineta', 'otro')),
  estado text NOT NULL DEFAULT 'en_curso' CHECK (estado IN ('en_curso', 'finalizado')),
  distancia_m double precision NOT NULL DEFAULT 0 CHECK (distancia_m >= 0),
  -- Segundos que duro el viaje y quedan vacios hasta que se finaliza
  duracion_s int CHECK (duracion_s >= 0),
  -- Reportes que el ciudadano envio mientras duraba el viaje y se cuentan al finalizarlo
  cantidad_reportes int NOT NULL DEFAULT 0 CHECK (cantidad_reportes >= 0),
  iniciado_en timestamptz NOT NULL DEFAULT now(),
  finalizado_en timestamptz,
  CONSTRAINT finalizado_con_fecha CHECK ((estado = 'finalizado') = (finalizado_en IS NOT NULL)),
  CONSTRAINT finalizado_con_duracion CHECK ((estado = 'finalizado') = (duracion_s IS NOT NULL))
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

-- Codigos para restablecer la contrasena de un ciudadano de la app y llegan a su correo
-- solo se guarda el hash del codigo y cada codigo sirve una sola vez antes de vencer
-- intentos cuenta los codigos equivocados para que nadie pueda adivinarlo probando uno por uno
CREATE TABLE movil.restablecimientos_contrasena (
  id serial PRIMARY KEY,
  usuario_id int NOT NULL REFERENCES movil.usuarios (id) ON DELETE CASCADE,
  codigo_hash text NOT NULL,
  intentos int NOT NULL DEFAULT 0 CHECK (intentos >= 0),
  vence_en timestamptz NOT NULL,
  usado_en timestamptz,
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX restablecimientos_movil_usuario_idx ON movil.restablecimientos_contrasena (usuario_id);

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

-- Viajes reales de la app vistos desde el dashboard para contar los usuarios de micromovilidad
-- es una vista y no una tabla porque los datos ya estan en movil.viajes y asi nunca se desincronizan
-- la localidad es la del lugar conocido mas cercano al punto de salida del viaje igual que en los reportes
CREATE VIEW compartido.viajes_ciudadanos AS
SELECT
  v.id AS viaje_id,
  v.usuario_id,
  v.tipo_vehiculo,
  v.iniciado_en,
  l.localidad_id
FROM movil.viajes v
LEFT JOIN LATERAL (
  SELECT p.latitud, p.longitud FROM movil.puntos_viaje p WHERE p.viaje_id = v.id ORDER BY p.registrado_en, p.id LIMIT 1
) salida ON true
LEFT JOIN compartido.lugares l ON l.id = compartido.lugar_mas_cercano(salida.latitud, salida.longitud);

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
  -- true cuando la contrasena la puso otra persona (el admin inicial o un admin al crear o editar al usuario)
  -- mientras sea true el usuario solo puede ver su perfil y cambiar su contrasena
  debe_cambiar_contrasena boolean NOT NULL DEFAULT false,
  -- Se actualiza en cada inicio de sesion y es null si nunca ha entrado
  ultimo_ingreso timestamptz,
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
CREATE INDEX viajes_iniciado_en_idx ON movil.viajes (iniciado_en);

-- Por siniestro porque la grafica de sexo y edad une cada siniestro con sus personas
CREATE INDEX actores_viales_siniestro_id_idx ON dashboard.actores_viales (siniestro_id);

-- Por ciudadano porque la app lista los reportes y activaciones de un usuario
CREATE INDEX reportes_usuario_id_idx ON compartido.reportes (usuario_id);
CREATE INDEX activaciones_panico_usuario_id_idx ON compartido.activaciones_panico (usuario_id);

-- ============================== vistas para la app ==============================

-- Donde ocurrieron los siniestros del anuario, para que la app movil calcule rutas que los esquiven
-- la tabla es del tablero y la app no la lee directamente: lee esta vista, igual que el tablero lee los viajes con compartido.viajes_ciudadanos
-- el riesgo se calcula en el backend y nunca se le muestra al ciudadano
CREATE VIEW compartido.siniestros_viales AS
SELECT
  id,
  latitud,
  longitud,
  tipo_vehiculo = 'bicicleta' AS con_bicicleta,
  gravedad = 'con_muertos' AS con_muertos
FROM dashboard.siniestros;
