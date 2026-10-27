import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function reportApiUnavailable(proxy) {
  proxy.on("error", (error, request, response) => {
    console.error(`API proxy unavailable for ${request.url}: ${error.message}`);
    if (response.headersSent) return;
    response.writeHead(503, { "Content-Type": "application/json" });
    response.end(JSON.stringify({
      message: "Sportify API is unavailable. Check the API server and MongoDB Atlas connection, then retry."
    }));
  });
}

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": { target: "http://localhost:5000", configure: reportApiUnavailable },
      "/uploads": { target: "http://localhost:5000", configure: reportApiUnavailable }
    }
  }
});
