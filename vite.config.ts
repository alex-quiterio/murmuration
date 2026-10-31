/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * One alias per DDD layer. Outer layers import a layer's public barrel
 * (`@domain`, `@application`, …); the architecture test forbids reaching
 * into another layer's internals.
 */
const layers = ["domain", "application", "infrastructure", "presentation"] as const;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: Object.fromEntries(layers.map((layer) => [`@${layer}`, `/src/${layer}`])),
  },
  server: {
    port: 5173,
    open: true,
  },
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
