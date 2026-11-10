// Unica puerta del modulo y lo unico que el BFF puede importar de aqui
export { TripsModule } from './trips.module';
export { ESTADOS_VIAJE } from './domain/catalogos';
export type { EstadoViaje } from './domain/catalogos';
export type { PuntoViaje, Viaje, ViajeConPuntos } from './domain/viaje';
export { DomainError } from '../../../shared/domain-error';
export { IniciarViajeUseCase } from './application/iniciar-viaje.use-case';
export { RegistrarPuntoUseCase } from './application/registrar-punto.use-case';
export { FinalizarViajeUseCase } from './application/finalizar-viaje.use-case';
export { ListarViajesUseCase } from './application/listar-viajes.use-case';
export { ObtenerViajeUseCase } from './application/obtener-viaje.use-case';
