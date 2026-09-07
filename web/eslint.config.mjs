import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Node tooling that regenerates the image assets (T18); not app code.
    "public/images/_tools/**",
  ]),
  {
    // Pre-existing patterns in this codebase use setState in effects and refs
    // during render intentionally (e.g. keeping callbacks fresh in refs to
    // avoid stale closures in event handlers). These rules are too strict
    // for the established patterns; revisit when the codebase migrates.
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
    },
  },
]);

export default eslintConfig;
