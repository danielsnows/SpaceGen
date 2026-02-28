import { defineConfig } from "vite";
import { resolve } from "path";
import { execSync } from "child_process";
import react from "@vitejs/plugin-react";

/** Runs inline-ui.js after build so ui.js is inlined into ui.html (needed for Figma). */
function inlineUiPlugin() {
  return {
    name: "inline-ui",
    closeBundle() {
      execSync("node scripts/inline-ui.js", { cwd: resolve(__dirname) });
    },
  };
}

/**
 * Two builds so that code.js is IIFE (Figma loads plugin as classic script, no ES modules).
 * Run: npm run build (runs both); or vite build --mode code | vite build --mode ui
 */
export default defineConfig(({ mode }) => {
  const isCodeBuild = mode === "code";
  return {
    plugins: isCodeBuild ? [] : [react(), inlineUiPlugin()],
    base: "./",
    build: {
      outDir: "dist",
      emptyOutDir: isCodeBuild,
      rollupOptions: {
        input: isCodeBuild
          ? { code: resolve(__dirname, "src/main.ts") }
          : { ui: resolve(__dirname, "ui.html") },
        output: isCodeBuild
          ? { format: "iife", entryFileNames: "code.js" }
          : {
              format: "es",
              entryFileNames: "ui.js",
              chunkFileNames: "ui-[name].js",
              assetFileNames: "[name].[ext]",
            },
      },
      target: isCodeBuild ? "es2015" : "es2020",
      minify: false,
      sourcemap: true,
    },
  };
});
