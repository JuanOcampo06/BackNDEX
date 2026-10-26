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
  { nombre: 'App movil - Reportes', descripcion: 'Reportes ciudadanos en camelCase' },
  { nombre: 'App movil - Boton de panico', descripcion: 'Activaciones del boton de panico en camelCase' },
];

// Pagina de Swagger con todos los endpoints del dashboard y de la app movil en /api/docs
// el JSON del documento queda en /api/docs-json por si el frontend lo quiere importar
export function configurarSwagger(app: INestApplication): void {
  const constructor = new DocumentBuilder()
    .setTitle('Safe Path Twin API')
    .setDescription('Endpoints del dashboard en /api/dashboard/v1 y de la app movil en /api/mobile/v1')
    .setVersion('0.1.0');
  for (const etiqueta of ETIQUETAS) {
    constructor.addTag(etiqueta.nombre, etiqueta.descripcion);
  }
  const documento = SwaggerModule.createDocument(app, constructor.build());
  SwaggerModule.setup(RUTA_SWAGGER, app, documento);
}
