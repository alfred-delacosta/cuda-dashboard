import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  root: path.resolve("src/client"),
  publicDir: path.resolve("src/client/public"),
  build: {
    outDir: path.resolve("dist/client"),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/api": "http://127.0.0.1:3000",
    },
  },
});
