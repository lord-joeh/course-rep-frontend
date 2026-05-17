import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import flowbiteReact from "flowbite-react/plugin/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), flowbiteReact()],

  server: {
    allowedHosts: [".ngrok-free.dev", "https://pq7vj4p1-4173.uks1.devtunnels.ms/"],
  },
});
