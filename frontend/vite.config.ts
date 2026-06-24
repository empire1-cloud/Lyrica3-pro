import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3002,
    proxy: {
      "/api": {
        target: "https://lyrica3-pro.onrender.com",
        changeOrigin: true,
      },
      "/livesession": {
        target: "http://localhost:3004",
        changeOrigin: true,
      },
    },
  },
});
