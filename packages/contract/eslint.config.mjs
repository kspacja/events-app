import { defineConfig } from "eslint/config";
import { importBoundaries, tsPackageConfig } from "@events/eslint-config";

export default defineConfig([
  ...tsPackageConfig({ tsconfigRootDir: import.meta.dirname }),
  importBoundaries({ isPackage: true }),
]);
