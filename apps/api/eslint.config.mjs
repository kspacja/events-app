import { defineConfig } from "eslint/config";
import { appBoundaries, tsPackageConfig } from "@events/eslint-config";

export default defineConfig([
  ...tsPackageConfig({ tsconfigRootDir: import.meta.dirname }),
  ...appBoundaries("api"),
]);
