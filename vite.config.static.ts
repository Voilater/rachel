import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

const spaClientEntry = path.resolve("src/entry-spa.tsx");
const reactStartClientEntry = path.resolve(
  "node_modules/@tanstack/react-start/dist/plugin/default-entry/client.tsx",
);

function spaClientEntryPlugin(): Plugin {
  return {
    name: "vk-spa-client-entry",
    enforce: "pre",
    resolveId(source) {
      if (source === reactStartClientEntry || source.endsWith("default-entry/client.tsx")) {
        return spaClientEntry;
      }
      return null;
    },
  };
}

/** Client SPA build for S3 / CloudFront (no Nitro server). */
export default defineConfig({
  base: "./",
  server: { port: 3000 },
  build: {
    outDir: "dist/static",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      [reactStartClientEntry]: spaClientEntry,
    },
  },
  plugins: [
    spaClientEntryPlugin(),
    tailwindcss(),
    tsConfigPaths(),
    tanstackStart({ srcDirectory: "src" }),
    viteReact(),
  ],
});
