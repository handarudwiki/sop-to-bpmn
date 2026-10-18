import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Diakses lewat Cloudflare Tunnel.
  server: { allowedHosts: ['flowforge.kodr.tech'] },
  preview: { allowedHosts: ['flowforge.kodr.tech'] },
})
