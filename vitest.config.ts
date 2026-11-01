import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const src = (path: string) => fileURLToPath(new URL(`./src/${path}`, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@mrzr/react-form-builder/plain": src("plain/index.ts"),
      "@mrzr/react-form-builder/jalali": src("jalali/index.ts"),
      "@mrzr/react-form-builder": src("index.ts"),
    },
  },
  test: { include: ["test/**/*.test.{ts,tsx}"] },
});
