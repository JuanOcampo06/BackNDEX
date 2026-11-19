// Unica puerta del modulo y lo unico que el BFF puede importar de aqui
export { SemaforosModule } from './semaforos.module';
export type { Semaforo } from './domain/semaforo';
export type { SemaforosEnArea } from './application/obtener-semaforos.use-case';
export { DomainError } from '../../../shared/domain-error';
export { ObtenerSemaforosUseCase } from './application/obtener-semaforos.use-case';
