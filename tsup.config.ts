import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/scanner/scanner.ts'],
  format: ['esm'],
  target: 'node24',
  outDir: 'dist',
  sourcemap: true,
  bundle: true,
  splitting: false,
  clean: true,
});
