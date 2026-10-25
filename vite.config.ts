import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// `BASE_PATH` is injected by the GitHub Pages workflow (e.g. "/uta-kotoba/").
// Falling back to "./" keeps local previews and arbitrary static hosting working.
const base = process.env.BASE_PATH ?? './'

export default defineConfig({
  base,
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
