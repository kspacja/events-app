import { defineConfig } from "eslint/config";
import { packageBoundaries, tsPackageConfig } from "@events/eslint-config";

export default defineConfig([
  ...tsPackageConfig({ tsconfigRootDir: import.meta.dirname }),
  ...packageBoundaries("catalog"),
]);
