import { copyFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const registry = fileURLToPath(new URL('../../registry', import.meta.url))
const dist = fileURLToPath(new URL('./dist', import.meta.url))

// Builds the npm package straight from registry/ — the same source the
// copy-paste registry ships — so the two can never drift apart.
export default defineConfig({
  plugins: [
    vue(),
    dts({
      tsconfigPath: fileURLToPath(new URL('./tsconfig.json', import.meta.url)),
      root: registry,
      entryRoot: registry,
      include: ['**/*.ts', '**/*.vue'],
      outDir: dist,
    }),
    {
      name: 'vuelix:copy-css',
      closeBundle() {
        copyFileSync(fileURLToPath(new URL('./src/tailwind.css', import.meta.url)), `${dist}/tailwind.css`)
      },
    },
  ],
  resolve: {
    alias: [
      { find: /^@\/components\/ui\//, replacement: `${registry}/ui/` },
      { find: /^@\//, replacement: `${registry}/` },
    ],
  },
  build: {
    outDir: dist,
    emptyOutDir: true,
    sourcemap: false,
    minify: false,
    lib: {
      entry: `${registry}/index.ts`,
      formats: ['es'],
    },
    rollupOptions: {
      // Keep one file per module so bundlers can tree-shake unused components.
      external: [/^vue($|\/)/, /^motion-v($|\/)/, /^@vueuse\//, 'class-variance-authority', 'clsx', 'tailwind-merge'],
      output: {
        preserveModules: true,
        preserveModulesRoot: registry,
        entryFileNames: '[name].js',
      },
    },
  },
})
