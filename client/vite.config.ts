import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command, mode }) => {
  if (command === "build") {
    const apiUrl = loadEnv(mode, ".", "VITE_API_URL").VITE_API_URL?.trim();
    if (!apiUrl) throw new Error("Set VITE_API_URL to the HTTPS Render origin before building.");
    const url = new URL(apiUrl);
    if (url.protocol !== "https:" || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(url.hostname) || url.pathname !== "/" || url.search || url.hash || url.username || url.password) {
      throw new Error("VITE_API_URL must be an HTTPS backend origin without /api or credentials.");
    }
  }
  return {
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Listen on 0.0.0.0 so all network devices (Wi-Fi, hotspot, LAN) can access
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  };
});
