import { defineConfig, globalIgnores } from "eslint/config";
import { importBoundaries } from "./src/index.mjs";

export default defineConfig([
  importBoundaries({ isPackage: true }),
  globalIgnores(["node_modules/**"]),
]);
