import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/auth": process.env.VITE_PROXY_TARGET || "http://localhost:8000",
      "/products": process.env.VITE_PROXY_TARGET || "http://localhost:8000",
      "/customers": process.env.VITE_PROXY_TARGET || "http://localhost:8000",
      "/orders": process.env.VITE_PROXY_TARGET || "http://localhost:8000",
    },
  },
})
