import { defineConfig } from "eslint/config";
import { packageBoundaries } from "./src/index.mjs";

export default defineConfig([...packageBoundaries("eslint-config")]);
