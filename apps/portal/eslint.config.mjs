import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { importBoundaries } from "@events/eslint-config";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  importBoundaries({ isPackage: false }),
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/maplibre/**",
  ]),
]);

export default eslintConfig;
