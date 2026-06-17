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
    proxy: Object.fromEntries(
      ["/auth", "/products", "/customers", "/orders"].map((path) => [
        path,
        {
          target: process.env.VITE_PROXY_TARGET || "http://localhost:8000",
          bypass(req: { headers: { accept?: string }; url?: string }) {
            if (req.headers.accept?.includes("text/html")) {
              return req.url;
            }
          },
        },
      ]),
    ),
  },
})
