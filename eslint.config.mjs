import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import simpleImportSort from "eslint-plugin-simple-import-sort";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      // "simple-import-sort/imports": "error",
      // "simple-import-sort/exports": "error",

       // ❌ Disable import sorting
      "simple-import-sort/imports": "off",
      "simple-import-sort/exports": "off",

      // ❌ Disable unused vars (optional)
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
];

export default eslintConfig;
