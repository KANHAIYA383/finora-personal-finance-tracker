
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            const username = process.env.DEV_AUTH_USERNAME;
            const password = process.env.DEV_AUTH_PASSWORD;

            if (username && password) {
              const token = Buffer.from(`${username}:${password}`).toString("base64");
              proxyReq.setHeader("Authorization", `Basic ${token}`);
            }
          });
        },
      },
    },
  },
});
