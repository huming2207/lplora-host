import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";

export default [
  {files: ["**/*.{js,mjs,cjs,ts}"],},
  {languageOptions: { globals: globals.node, ecmaVersion: 5, sourceType: "module" }, rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-useless-escape": "off"
  }, },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettier,
];