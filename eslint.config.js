import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/client/**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // Data fetch and EventSource subscribe on mount / pause toggle.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["src/server/**/*.ts", "src/core/**/*.ts", "tests/**/*.ts", "scripts/**/*.{js,mjs}"],
    languageOptions: {
      globals: globals.node,
    },
  },
);
