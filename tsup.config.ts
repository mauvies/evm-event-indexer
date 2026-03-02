import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/scanner/scanner.ts', 'src/api/server.ts'],
  format: ['esm'],
  target: 'node24',
  outDir: 'dist',
  sourcemap: true,
  bundle: true,
  splitting: false,
  clean: true,
});
