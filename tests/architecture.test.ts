import { describe, expect, it } from "vitest";

/**
 * Enforces the DDD layering with Vite's own `import.meta.glob`:
 *
 *   presentation → application, infrastructure
 *   infrastructure → application, domain
 *   application → domain
 *   domain → nothing
 *
 * Domain and application must also be pure: no clock, no Math.random, no
 * browser globals, no third-party packages.
 */
const sources = import.meta.glob<string>("/src/**/*.{ts,tsx}", { query: "?raw", import: "default", eager: true });

type Layer = "domain" | "application" | "infrastructure" | "presentation";

const allowed: Record<Layer, readonly string[]> = {
  domain: [],
  application: ["@domain"],
  infrastructure: ["@domain", "@application"],
  presentation: ["@application", "@infrastructure"],
};

const PURE_LAYERS: readonly Layer[] = ["domain", "application"];
const IMPURE = /\b(Math\.random|Date\.now|new Date|performance\.|window\.|document\.|globalThis|console\.|setTimeout|setInterval|requestAnimationFrame|fetch\()/;

const files = Object.entries(sources).flatMap(([path, code]) => {
  const layer = path.split("/")[2] as Layer;
  return layer in allowed ? [{ path, code, layer }] : [];
});

const importsOf = (code: string) => [...code.matchAll(/^\s*(?:import|export)\b[^'"]*?from\s+["']([^"']+)["']/gm)].map((m) => m[1]!);

describe("architecture", () => {
  it.each(files)("$path only depends on the layers it may", ({ code, layer }) => {
    for (const spec of importsOf(code)) {
      if (spec.startsWith(".") || spec.startsWith(`@${layer}`)) continue;
      const crossLayer = spec.match(/^@(domain|application|infrastructure|presentation)(\/.*)?$/);
      if (crossLayer) {
        expect(allowed[layer], `${layer} may not import ${spec}`).toContain(`@${crossLayer[1]}`);
        expect(crossLayer[2], `import ${spec} through the layer's public barrel`).toBeUndefined();
      } else {
        expect(PURE_LAYERS.includes(layer), `${layer} may not import the package "${spec}"`).toBe(false);
      }
    }
  });

  it.each(files.filter((f) => PURE_LAYERS.includes(f.layer)))("$path is pure", ({ code }) => {
    const stripped = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
    expect(stripped.match(IMPURE)?.[0]).toBeUndefined();
  });
});
