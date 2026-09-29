/**
 * apiConfig.ts
 * Centralized API base URL resolver for Lingkod Batas.
 *
 * Automatically resolves:
 * 1. Explicit production URL if VITE_API_URL is configured (e.g. Render, Railway, or custom domain).
 * 2. When accessed from a phone/laptop over any network (Wi-Fi, hotspot, LAN, e.g. http://172.20.10.2:5173),
 *    dynamically targets port 5000 on that same network IP (http://172.20.10.2:5000).
 * 3. Default fallback to http://localhost:5000 when accessing on the host computer.
 */
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  // If explicitly configured for production (and not placeholder localhost)
  if (envUrl && envUrl.trim() !== "" && !envUrl.includes("localhost")) {
    return envUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;
    // If accessed over a network IP or host (e.g., 192.168.x.x, 172.20.x.x, 10.x.x.x)
    if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `${protocol}//${hostname}:5000`;
    }
  }

  return envUrl && envUrl.trim() !== ""
    ? envUrl.replace(/\/+$/, "")
    : "http://localhost:5000";
}

export const BASE_URL = getApiBaseUrl();
