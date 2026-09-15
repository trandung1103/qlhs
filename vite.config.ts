import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Older Safari/iOS can hit a hard parse error (blank white page, nothing
    // renders) on syntax newer than this — Vite's default target assumes a
    // fairly recent Safari, so pin an older floor here.
    target: ['es2019', 'safari12'],
  },
})
