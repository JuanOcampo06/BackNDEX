-- Tablas de la app movil con ciudadanos reportes y boton de panico
-- viven en la misma base safepath pero dentro del schema movil
-- asi su tabla reportes no choca con la tabla reportes del dashboard
-- Docker ejecuta este archivo solo la primera vez que se crea el volumen de postgres

CREATE SCHEMA movil;

-- Ciudadanos que usan la app
CREATE TABLE movil.usuarios (
  id serial PRIMARY KEY,
  nombre_completo text NOT NULL,
  correo text NOT NULL UNIQUE,
  telefono text,
  creado_en timestamptz NOT NULL DEFAULT now()
);

-- Reportes que el ciudadano envia desde la app
-- las categorias son las mismas que muestra el dashboard
-- el estado lo cambia luego la entidad y al crearlo siempre es recibido
CREATE TABLE movil.reportes (
  id serial PRIMARY KEY,
  usuario_id int NOT NULL REFERENCES movil.usuarios (id),
  categoria text NOT NULL CHECK (categoria IN ('via_en_mal_estado', 'poca_iluminacion', 'obstaculo_en_cicloruta', 'conductor_imprudente', 'hurto_o_inseguridad')),
  descripcion text CHECK (char_length(descripcion) <= 500),
  latitud double precision NOT NULL CHECK (latitud BETWEEN -90 AND 90),
  longitud double precision NOT NULL CHECK (longitud BETWEEN -180 AND 180),
  estado text NOT NULL DEFAULT 'recibido' CHECK (estado IN ('recibido', 'en_revision', 'resuelto', 'descartado')),
  creado_en timestamptz NOT NULL DEFAULT now()
);

-- Activaciones del boton de panico
-- una activacion nace activa y luego puede ser atendida o cancelada por el ciudadano
CREATE TABLE movil.activaciones_sos (
  id serial PRIMARY KEY,
  usuario_id int NOT NULL REFERENCES movil.usuarios (id),
  latitud double precision NOT NULL CHECK (latitud BETWEEN -90 AND 90),
  longitud double precision NOT NULL CHECK (longitud BETWEEN -180 AND 180),
  estado text NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'atendida', 'cancelada')),
  activado_en timestamptz NOT NULL DEFAULT now()
);

-- Indices para las consultas por ciudadano y por fecha
CREATE INDEX reportes_usuario_id_idx ON movil.reportes (usuario_id);
CREATE INDEX reportes_creado_en_idx ON movil.reportes (creado_en);
CREATE INDEX activaciones_sos_usuario_id_idx ON movil.activaciones_sos (usuario_id);
CREATE INDEX activaciones_sos_activado_en_idx ON movil.activaciones_sos (activado_en);
