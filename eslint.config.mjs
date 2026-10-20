// Las reglas de dependencia de CLAUDE.md, convertidas en errores de lint.
import eslint from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import tseslint from 'typescript-eslint';

const mismoProducto = { product: '{{from.element.captured.product}}' };
const mismoModulo = { ...mismoProducto, module: '{{from.element.captured.module}}' };

const elemento = (type, captured) => ({ element: captured ? { type, captured } : { type } });
const capasDelModulo = (...tipos) => tipos.map((tipo) => elemento(tipo, mismoModulo));
const externo = [{ module: { origin: 'external' } }, { module: { origin: 'core' } }];

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage', 'eslint.config.mjs'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: { alwaysTryTypes: true } },
      'boundaries/elements': [
        { type: 'domain', pattern: 'src/*/modules/*/domain', capture: ['product', 'module'] },
        { type: 'application', pattern: 'src/*/modules/*/application', capture: ['product', 'module'] },
        { type: 'infrastructure', pattern: 'src/*/modules/*/infrastructure', capture: ['product', 'module'] },
        { type: 'module', pattern: 'src/*/modules/*', capture: ['product', 'module'] },
        { type: 'bff', pattern: 'src/*/bff', capture: ['product'] },
        { type: 'platform', pattern: 'src/platform/*', capture: ['tool'] },
        { type: 'shared', pattern: 'src/shared' },
        { type: 'app', pattern: 'src' },
      ],
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          // Revisa también los imports de librerías externas y de Node, no solo los locales.
          checkAllOrigins: true,
          message: '{{from.element.types}} no puede importar {{to.element.types}} (ver CLAUDE.md)',
          policies: [
            { from: elemento('shared'), allow: { to: [elemento('shared')] } },
            {
              from: elemento('domain'),
              allow: { to: [...capasDelModulo('domain'), elemento('shared')] },
            },
            {
              from: elemento('application'),
              allow: { to: [...capasDelModulo('domain', 'application'), elemento('shared')] },
            },
            {
              from: elemento('infrastructure'),
              allow: {
                to: [...capasDelModulo('domain', 'application', 'infrastructure'), elemento('platform'), ...externo],
              },
            },
            {
              // <modulo>.module.ts e index.ts conectan las capas de su propio módulo.
              from: elemento('module'),
              allow: {
                to: [...capasDelModulo('domain', 'application', 'infrastructure'), elemento('shared'), ...externo],
              },
            },
            {
              // El BFF solo entra a los módulos de su mismo producto, y solo por su index.ts.
              from: elemento('bff'),
              allow: {
                to: [
                  elemento('bff', mismoProducto),
                  { element: { type: 'module', captured: mismoProducto, fileInternalPath: 'index.ts' } },
                  elemento('platform', { tool: 'auth' }),
                  ...externo,
                ],
              },
            },
            {
              // Dominio y aplicación son TypeScript puro: nada de NestJS, ORMs ni drivers.
              from: [elemento('domain'), elemento('application')],
              disallow: { to: externo },
              message: 'domain/ y application/ no pueden importar librerías externas (ver CLAUDE.md)',
            },
            {
              from: elemento('platform'),
              allow: { to: [elemento('platform'), elemento('shared'), ...externo] },
            },
            {
              from: elemento('app'),
              allow: { to: [elemento('app'), elemento('bff'), ...externo] },
            },
          ],
        },
      ],
    },
  },
);
