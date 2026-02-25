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

export default defineConfig({
  plugins: [react(), inlineUiPlugin()],
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        code: resolve(__dirname, "src/main.ts"),
        ui: resolve(__dirname, "ui.html"),
      },
      output: {
        entryFileNames: (chunkInfo) =>
          chunkInfo.name === "code" ? "code.js" : "[name].js",
        chunkFileNames: "ui-[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
    target: "es2020",
    minify: false,
    sourcemap: true,
  },
});
