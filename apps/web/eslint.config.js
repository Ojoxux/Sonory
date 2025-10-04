import js from "@eslint/js"
import reactYouMightNotNeedAnEffect from "eslint-plugin-react-you-might-not-need-an-effect"
import { defineConfig } from "eslint/config"
import globals from "globals"
import tseslint from "typescript-eslint"

export default defineConfig([
   // 推奨されているJavaScriptのルール
   js.configs.recommended,

   // 推奨されているTypeScriptのルール
   ...tseslint.configs.recommended,

   // React You Might Not Need An Effectプラグイン
   reactYouMightNotNeedAnEffect.configs.recommended,

   {
      files: ["**/*.{js,jsx,ts,tsx}"],
      languageOptions: {
         globals: {
            ...globals.browser,
            ...globals.node,
         },
         parserOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            ecmaFeatures: {
               jsx: true,
            },
         },
      },
      rules: {
         // 必要だったらルールを追加していく
         "@typescript-eslint/no-unused-vars": [
            "warn",
            {
               argsIgnorePattern: "^_",
               varsIgnorePattern: "^_",
            },
         ],
         "@typescript-eslint/no-explicit-any": "warn",
      },
   },

   // 除外したいパターンを記載する
   {
      ignores: [
         ".next/**",
         "node_modules/**",
         "out/**",
         "public/sw.js",
         "public/workbox-*.js",
         "public/worker-*.js",
         "**/*.config.js",
         "**/*.config.mjs",
         "next-env.d.ts",
         "next.config.ts",
      ],
   },
])
