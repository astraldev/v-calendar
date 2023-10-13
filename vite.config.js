import path from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "url";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "./src/lib.js"),
      name: "v-calendar",
      formats: ["es", "cjs", "umd"],
      fileName: (format) => `v-calendar.${format}.js`,
    },
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "./src/lib.js")
      },
      external: ["vue"],
      output: {
        exports: "named",
        globals: {
          vue: "Vue",
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [vue()],
});
