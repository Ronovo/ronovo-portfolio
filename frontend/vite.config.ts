import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const flask = "http://127.0.0.1:5000";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": flask,
      "/static": flask,
      "/account": flask,
      "/sso": flask,
      "^/projects/.+": flask,
    },
  },
});
