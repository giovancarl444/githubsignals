import { defineConfig, globalIgnores } from 'eslint/config';
import next from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';
export default defineConfig([
  ...next,
  ...typescript,
  globalIgnores([
    '.next/**',
    '.local/**',
    '.agents/**',
    'next-env.d.ts',
    'playwright-report/**',
    'test-results/**',
  ]),
  { rules: { '@typescript-eslint/no-require-imports': 'off' } },
]);
