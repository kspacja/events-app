import { defineConfig } from "eslint/config";
import { importBoundaries } from "./src/index.mjs";

export default defineConfig([importBoundaries({ isPackage: true })]);
