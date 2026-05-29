import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", "coverage/**", ".pubwave/**", ".pubwavecli/**", "assets/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node }
    },
    rules: {
      // TypeScript checks identifier resolution; the core rule yields false
      // positives on type-only and ambient references.
      "no-undef": "off",
      // ANSI escape handling deliberately matches control chars (\x1b) in regex.
      "no-control-regex": "off",
      // The library leans on `any` for generic host-config plumbing; surface it
      // without failing the build so the baseline stays green.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }]
    }
  },
  {
    files: ["**/*.tsx"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn"
    }
  },
  {
    // Tests intentionally use casts/stubs to reach internal shapes.
    files: ["tests/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
);
