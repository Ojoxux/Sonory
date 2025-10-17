import js from "@eslint/js"
import { defineConfig } from "eslint/config"
import reactYouMightNotNeedAnEffect from "eslint-plugin-react-you-might-not-need-an-effect"
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
         // TypeScript関連のルール（Biomeと重複しないもののみ）
         "@typescript-eslint/no-unused-vars": [
            "warn",
            {
               argsIgnorePattern: "^_",
               varsIgnorePattern: "^_",
            },
         ],
         "@typescript-eslint/no-explicit-any": "warn",

         // フォーマット関連のルールを無効化（Biomeに任せる）
         semi: "off",
         quotes: "off",
         indent: "off",
         "comma-dangle": "off",
         "@typescript-eslint/semi": "off",
         "@typescript-eslint/quotes": "off",
         "@typescript-eslint/indent": "off",
         "@typescript-eslint/comma-dangle": "off",
         "@typescript-eslint/member-delimiter-style": "off",
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
