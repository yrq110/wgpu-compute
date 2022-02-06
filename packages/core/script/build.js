
const { build } = require('esbuild');

build({
  entryPoints: ['./src/index.ts'],
  outfile: 'dist/bundle.js',
  bundle: true,
  minify: true,
  sourcemap: false,
  format: 'esm'
})