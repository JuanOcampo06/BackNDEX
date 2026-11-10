import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Direccion de la pagina de Swagger dentro de la api
const RUTA_SWAGGER = 'api/docs';

// Grupos en el mismo orden en que se ven en la pagina primero lo compartido luego el dashboard y al final la app movil
// cada controlador usa uno de estos nombres en su ApiTags
const ETIQUETAS = [
  { nombre: 'Compartido - Estado de la api', descripcion: 'Comprobar que todo el backend esta vivo' },
  { nombre: 'Compartido - Ciclovias', descripcion: 'Ciclovias por zona del mapa con una puerta en cada producto' },
  { nombre: 'Dashboard - Login', descripcion: 'Inicio de sesion de demostracion del dashboard' },
  { nombre: 'Dashboard - Tablero', descripcion: 'Tarjetas y graficas del tablero en snake_case' },
  { nombre: 'Dashboard - Usuarios', descripcion: 'Crear editar y eliminar usuarios del dashboard en snake_case' },
  { nombre: 'App movil - Autenticacion', descripcion: 'Registro e inicio de sesion del ciudadano que entregan el token JWT' },
  { nombre: 'App movil - Reportes', descripcion: 'Reportes ciudadanos en camelCase y piden token' },
  { nombre: 'App movil - Boton de panico', descripcion: 'Activaciones del boton de panico en camelCase y piden token' },
  { nombre: 'App movil - Rutas', descripcion: 'Ruta segura, equilibrada y rapida entre dos puntos en camelCase y piden token' },
  { nombre: 'App movil - Viajes', descripcion: 'Viajes en bicicleta con su recorrido GPS en camelCase y piden token' },
];

// Pagina de Swagger con todos los endpoints del dashboard y de la app movil en /api/docs
// el JSON del documento queda en /api/docs-json por si el frontend lo quiere importar
export function configurarSwagger(app: INestApplication): void {
  const constructor = new DocumentBuilder()
    .setTitle('Safe Path Twin API')
    .setDescription('Endpoints del dashboard en /api/dashboard/v1 y de la app movil en /api/mobile/v1')
    .setVersion('0.1.0')
    // Boton Authorize de Swagger: se pega el accessToken que entrega el login de la app movil
    .addBearerAuth();
  for (const etiqueta of ETIQUETAS) {
    constructor.addTag(etiqueta.nombre, etiqueta.descripcion);
  }
  const documento = SwaggerModule.createDocument(app, constructor.build());
  SwaggerModule.setup(RUTA_SWAGGER, app, documento);
}
