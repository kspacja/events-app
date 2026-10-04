import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import { importBoundaries } from "@events/eslint-config";

export default defineConfig([
  ...tseslint.configs.recommended,
  importBoundaries({ isPackage: true }),
  globalIgnores(["node_modules/**"]),
]);
